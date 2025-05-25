"use client"

import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import homepageSectionService from "../services/api/homepageSectionService"
import productService from "../services/api/productService"
import userService from "../services/api/userService"
import categoryService from "../services/api/categoryService"
import authService from "../services/api/authService"
import "./AdminDashboard.css"
import { FaPlus, FaEdit, FaTrash, FaUsers, FaBox, FaLayerGroup } from 'react-icons/fa'

const AdminDashboard = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  const [homePageSections, setHomePageSections] = useState([])
  const [activeTab, setActiveTab] = useState("homepage")
  const [isLoading, setIsLoading] = useState(true)
  const [showSectionForm, setShowSectionForm] = useState(false)
  const fileInputRef = useRef(null)
  const [sectionFormData, setSectionFormData] = useState({
    id: null,
    title: "",
    type: "banner",
    content: "",
    order: 0,
    active: true,
  })
  
  // State for parsed content based on section type
  const [bannerData, setBannerData] = useState({
    slides: [
      {
        imageUrl: "",
        title: "",
        subtitle: "",
        buttonText: "",
        buttonLink: "",
      }
    ]
  })
  
  const [categoriesData, setCategoriesData] = useState({
    categories: [],
  })
  
  const [productsData, setProductsData] = useState({
    productIds: [],
  })
  
  const [iconCategoriesData, setIconCategoriesData] = useState({
    categories: [],
  })

  // Create refs for each category file input
  const categoryFileInputRefs = useRef([])

  // Add state for product search
  const [productSearch, setProductSearch] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  // Add state for selected products
  const [selectedProducts, setSelectedProducts] = useState([])

  // Add state for all products
  const [allProducts, setAllProducts] = useState([])

  const [categories, setCategories] = useState([])
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [categoryFormData, setCategoryFormData] = useState({
    id: null,
    name: '',
    description: '',
    parent: '',
    image: null,
    isTrending: false
  })

  const [sellers, setSellers] = useState([])
  const [sellerApplications, setSellerApplications] = useState([])
  const [selectedSeller, setSelectedSeller] = useState(null)
  const [showSellerModal, setShowSellerModal] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login')
      return
    }
    fetchData()
  }, [isAuthenticated, user, navigate])

  // Save to localStorage whenever homePageSections changes
  useEffect(() => {
    if (homePageSections.length > 0) {
      localStorage.setItem('homePageSections', JSON.stringify(homePageSections))
      console.log('Saved homepage sections to localStorage:', homePageSections)
    }
  }, [homePageSections])

  useEffect(() => {
    // Parse content based on section type when sectionFormData changes
    if (sectionFormData.content && sectionFormData.type) {
      try {
        const contentObj = typeof sectionFormData.content === 'string' 
          ? JSON.parse(sectionFormData.content) 
          : sectionFormData.content;
        
        if (sectionFormData.type === "banner") {
          // Convert old format to new slides format if needed
          if (!contentObj.slides && (contentObj.image || contentObj.title)) {
            setBannerData({
              slides: [{
                imageUrl: contentObj.image || '',
                title: contentObj.title || '',
                subtitle: contentObj.subtitle || '',
                buttonText: contentObj.buttonText || '',
                buttonLink: contentObj.buttonLink || '',
              }]
            });
          } else {
            setBannerData(contentObj);
          }
        } else if (sectionFormData.type === "categories") {
          setCategoriesData(contentObj);
        } else if (sectionFormData.type === "products") {
          setProductsData(contentObj);
          // If we have product IDs, populate selectedProducts
          if (contentObj.productIds && Array.isArray(contentObj.productIds)) {
            setSelectedProducts(contentObj.productIds);
          } else {
            setSelectedProducts([]);
          }
        } else if (sectionFormData.type === "icon-categories") {
          setIconCategoriesData(contentObj);
        }
      } catch (error) {
        console.error("Error parsing content:", error);
      }
    }
  }, [sectionFormData.content, sectionFormData.type]);

  // Get default sections when no sections are available
  const getDefaultSections = () => {
    return [
      {
        id: 1,
        title: "Welcome Banner",
        type: "banner",
        content: {
          slides: [
            {
              imageUrl: "/placeholder.svg?height=400&width=1200&text=Welcome",
              title: "Welcome to Our Store",
              subtitle: "Discover amazing products at great prices",
              buttonText: "Shop Now",
              buttonLink: "/products"
            }
          ]
        },
        order: 1,
        active: true
      },
      {
        id: 2,
        title: "Featured Categories",
        type: "categories",
        content: {
          categories: [
            {
              name: "Category 1",
              description: "Explore Category 1",
              image: "/placeholder.svg?height=200&width=200&text=Category1"
            },
            {
              name: "Category 2",
              description: "Explore Category 2",
              image: "/placeholder.svg?height=200&width=200&text=Category2"
            }
          ]
        },
        order: 2,
        active: true
      },
      {
        id: 3,
        title: "Featured Products",
        type: "products",
        content: {
          productIds: [1, 2, 3]
        },
        order: 3,
        active: true
      }
    ];
  };

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch homepage sections
      try {
        const sections = await homepageSectionService.getAdminSections();
        if (sections && sections.length > 0) {
          setHomePageSections(sections);
          localStorage.setItem('homePageSections', JSON.stringify(sections));
          
          const idsMap = {};
          sections.forEach(section => {
            if (section._id && section.order) {
              idsMap[section.order] = section._id;
            }
          });
          localStorage.setItem('sectionMongoIds', JSON.stringify(idsMap));
        } else {
          const shouldUseDefaults = window.confirm(
            "No sections found in database. Would you like to reset to default sections?"
          );
          
          if (shouldUseDefaults) {
            localStorage.removeItem('homePageSections');
            localStorage.removeItem('sectionMongoIds');
            setHomePageSections(getDefaultSections());
          } else {
            const savedSections = localStorage.getItem('homePageSections');
            if (savedSections) {
              setHomePageSections(JSON.parse(savedSections));
            } else {
              setHomePageSections(getDefaultSections());
            }
          }
        }
      } catch (error) {
        console.error('Error fetching homepage sections:', error);
        const shouldUseDefaults = window.confirm(
          "Error connecting to database. Would you like to reset to default sections?"
        );
        
        if (shouldUseDefaults) {
          localStorage.removeItem('homePageSections');
          localStorage.removeItem('sectionMongoIds');
          setHomePageSections(getDefaultSections());
        } else {
          const savedSections = localStorage.getItem('homePageSections');
          if (savedSections) {
            setHomePageSections(JSON.parse(savedSections));
          } else {
            setHomePageSections(getDefaultSections());
          }
        }
      }

      // Fetch users (only customers)
      try {
        const usersData = await userService.getUsersByRole('user');
        if (usersData && Array.isArray(usersData.users)) {
          setUsers(usersData.users);
        } else {
          console.error('Invalid users data structure:', usersData);
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      }

      // Fetch sellers
      try {
        const sellersData = await userService.getUsersByRole('seller');
        if (sellersData && Array.isArray(sellersData.users)) {
          setSellers(sellersData.users);
        } else {
          console.error('Invalid sellers data structure:', sellersData);
          setSellers([]);
        }
      } catch (error) {
        console.error('Error fetching sellers:', error);
        setSellers([]);
      }

      // Fetch sellers and seller applications
      try {
        const [sellersResponse, applicationsResponse] = await Promise.all([
          authService.getSellers(),
          authService.getSellerApplications()
        ]);
        
        setSellerApplications(applicationsResponse.data || []);
      } catch (error) {
        console.error('Error fetching sellers or applications:', error);
        setSellerApplications([]);
      }

      // Fetch products
      try {
        const productsData = await productService.getAllProducts();
        setProducts(productsData.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      }

      // Fetch categories
      try {
        const categoriesData = await categoryService.getAllCategories();
        setCategories(categoriesData.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching admin data:", error)
      setIsLoading(false)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  const handleAddSection = () => {
    setSectionFormData({
      id: null,
      title: "",
      type: "banner",
      content: "",
      order: homePageSections.length + 1,
      active: true,
    })
    
    // Reset form data for each type
    setBannerData({
      slides: [
        {
          imageUrl: "",
          title: "",
          subtitle: "",
          buttonText: "",
          buttonLink: "",
        }
      ]
    })
    
    setCategoriesData({
      categories: [],
    })
    
    setProductsData({
      productIds: [],
    })
    
    setIconCategoriesData({
      categories: [],
    })
    
    setShowSectionForm(true)
  }

  const handleEditSection = (section) => {
    // Ensure we're using the MongoDB _id if available, or fallback to numeric id
    const sectionId = section._id || section.id;
    
    console.log('Editing section:', {
      id: sectionId,
      title: section.title,
      type: section.type,
      content: section.content
    });
    
    // Parse content if it's a string
    let contentObj = section.content;
    if (typeof section.content === 'string') {
      try {
        contentObj = JSON.parse(section.content);
      } catch (error) {
        console.error('Error parsing section content:', error);
        contentObj = section.content;
      }
    }
    
    setSectionFormData({
      id: sectionId,
      title: section.title,
      type: section.type,
      content: contentObj,
      order: section.order,
      active: section.active,
    });

    // Set specific data based on section type
    if (section.type === "banner") {
      // Handle banner data
      if (contentObj.slides) {
        setBannerData(contentObj);
      } else {
        // Convert old format to new slides format
        setBannerData({
          slides: [{
            imageUrl: contentObj.image || '',
            title: contentObj.title || '',
            subtitle: contentObj.subtitle || '',
            buttonText: contentObj.buttonText || '',
            buttonLink: contentObj.buttonLink || '',
          }]
        });
      }
    } else if (section.type === "categories") {
      setCategoriesData(contentObj);
    } else if (section.type === "products") {
      setProductsData(contentObj);
      // Set selected products
      if (contentObj.productIds && Array.isArray(contentObj.productIds)) {
        setSelectedProducts(contentObj.productIds);
      }
    } else if (section.type === "icon-categories") {
      setIconCategoriesData(contentObj);
    }
    
    setShowSectionForm(true);
  };

  const handleDeleteSection = async (sectionId) => {
    if (window.confirm("Are you sure you want to delete this section?")) {
      try {
        // Delete from API
        await homepageSectionService.deleteSection(sectionId);
        
        // Update local state - filter by either id or _id
        setHomePageSections((prevSections) => 
          prevSections.filter((s) => s.id !== sectionId && s._id !== sectionId)
        );
        
        // Also update localStorage
        const updatedSections = homePageSections.filter(s => s.id !== sectionId && s._id !== sectionId);
        localStorage.setItem('homePageSections', JSON.stringify(updatedSections));
        console.log('Updated localStorage after deletion');
      } catch (error) {
        console.error("Error deleting section:", error);
        alert("Failed to delete section. Please try again.");
        
        // Fallback: Delete from local state only if API fails
        setHomePageSections((prevSections) => 
          prevSections.filter((s) => s.id !== sectionId && s._id !== sectionId)
        );
        
        // Also update localStorage
        const updatedSections = homePageSections.filter(s => s.id !== sectionId && s._id !== sectionId);
        localStorage.setItem('homePageSections', JSON.stringify(updatedSections));
      }
    }
  }

  const handleToggleSection = async (sectionId) => {
    try {
      // Find the section to toggle - check both id and _id
      const sectionToToggle = homePageSections.find(section => 
        section.id === sectionId || section._id === sectionId
      );
      
      if (!sectionToToggle) {
        console.error(`Section not found for toggling with ID: ${sectionId}`);
        return;
      }
      
      // Create updated section data
      const updatedSection = {
        ...sectionToToggle,
        active: !sectionToToggle.active
      };
      
      // Update in API
      await homepageSectionService.updateSection(sectionId, updatedSection);
      
      // Update local state - check both id and _id
      const updatedSections = homePageSections.map(section => 
        (section.id === sectionId || section._id === sectionId) 
          ? { ...section, active: !section.active } 
          : section
      );
      
      setHomePageSections(updatedSections);
      
      // Also update localStorage
      localStorage.setItem('homePageSections', JSON.stringify(updatedSections));
      console.log('Updated localStorage after toggling section');
    } catch (error) {
      console.error("Error toggling section:", error);
      alert("Failed to update section status. Please try again.");
      
      // Fallback: Update local state only if API fails
      const updatedSections = homePageSections.map(section => 
        (section.id === sectionId || section._id === sectionId) 
          ? { ...section, active: !section.active } 
          : section
      );
      
      setHomePageSections(updatedSections);
      
      // Also update localStorage
      localStorage.setItem('homePageSections', JSON.stringify(updatedSections));
    }
  }

  const handleSectionFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setSectionFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
    
    // If section type changes, reset the appropriate form data
    if (name === "type") {
      if (value === "banner") {
        setBannerData({
          slides: [
            {
              imageUrl: "",
              title: "",
              subtitle: "",
              buttonText: "",
              buttonLink: "",
            }
          ]
        });
        setSectionFormData(prev => ({
          ...prev,
          content: JSON.stringify({
            slides: [
              {
                imageUrl: "",
                title: "",
                subtitle: "",
                buttonText: "",
                buttonLink: "",
              }
            ]
          })
        }))
      } else if (value === "categories") {
        setCategoriesData({
          categories: [],
        })
        setSectionFormData(prev => ({
          ...prev,
          content: JSON.stringify({
            categories: [],
          })
        }))
      } else if (value === "products") {
        setProductsData({
          productIds: [],
        })
        setSectionFormData(prev => ({
          ...prev,
          content: JSON.stringify({
            productIds: [],
          })
        }))
      } else if (value === "icon-categories") {
        setIconCategoriesData({
          categories: [],
        })
        setSectionFormData(prev => ({
          ...prev,
          content: JSON.stringify({
            categories: [],
          })
        }))
      } else {
        // For custom type, just reset content
        setSectionFormData(prev => ({
          ...prev,
          content: ""
        }))
      }
    }
  }
  
  // Replace the handleBannerChange function to work with multiple slides
  const handleBannerChange = (slideIndex, field, value) => {
    setBannerData(prevData => {
      const newSlides = [...prevData.slides];
      newSlides[slideIndex] = {
        ...newSlides[slideIndex],
        [field]: value
      };
      
      const newData = {
        ...prevData,
        slides: newSlides
      };
      
      // Also update the form data to keep them in sync
      setSectionFormData(prev => ({
        ...prev,
        content: JSON.stringify(newData)
      }));
      
      return newData;
    });
  };
  
  // Add a function to add a new banner slide
  const handleAddBannerSlide = () => {
    // Update the banner data with a new empty slide
    setBannerData(prevData => {
      const newData = {
        ...prevData,
        slides: [
          ...prevData.slides,
          {
            imageUrl: "",
            title: "",
            subtitle: "",
            buttonText: "",
            buttonLink: ""
          }
        ]
      };
      
      // Also update the form data to keep them in sync
      setSectionFormData(prev => ({
        ...prev,
        content: JSON.stringify(newData)
      }));
      
      console.log('Added new slide - updated banner data:', newData);
      return newData;
    });
  };
  
  // Add a function to remove a banner slide
  const handleRemoveBannerSlide = (slideIndex) => {
    setBannerData(prevData => {
      // Keep at least one slide
      if (prevData.slides.length <= 1) return prevData;
      
      const newSlides = [...prevData.slides];
      newSlides.splice(slideIndex, 1);
      
      const newData = {
        ...prevData,
        slides: newSlides
      };
      
      // Also update the form data to keep them in sync
      setSectionFormData(prev => ({
        ...prev,
        content: JSON.stringify(newData)
      }));
      
      console.log('Removed slide at index', slideIndex, 'updated banner data:', newData);
      return newData;
    });
  };
  
  // Replace handleBannerImageUpload with a function that handles both file upload and URL input
  const handleBannerImageUpload = async (slideIndex, e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Show uploading indicator
      setBannerData(prevData => {
        const newSlides = [...prevData.slides];
        newSlides[slideIndex] = {
          ...newSlides[slideIndex],
          imageUrl: 'Uploading...'
        };
        return {
          ...prevData,
          slides: newSlides
        };
      });

      // Upload the file to Cloudinary
      console.log(`Starting upload for file: ${file.name} (${file.size} bytes)`);
      const uploadResponse = await homepageSectionService.uploadSectionImage(file, 'banner');
      
      console.log('Upload complete. Response:', uploadResponse);
      
      if (uploadResponse && uploadResponse.fileUrl) {
        console.log(`Banner image uploaded successfully to ${uploadResponse.fileUrl}`);
        
        // Update the banner data with the Cloudinary URL
        setBannerData(prevData => {
          const newSlides = [...prevData.slides];
          newSlides[slideIndex] = {
            ...newSlides[slideIndex],
            imageUrl: uploadResponse.fileUrl,
            public_id: uploadResponse.public_id
          };
          
          const newData = {
            ...prevData,
            slides: newSlides
          };
          
          // Also update the form data to keep them in sync
          setSectionFormData(prev => ({
            ...prev,
            content: JSON.stringify(newData)
          }));
          
          return newData;
        });
      } else {
        console.error('File upload failed - invalid response:', uploadResponse);
        alert('File upload failed. Please try again.');
        
        // Reset to empty on failure
        setBannerData(prevData => {
          const newSlides = [...prevData.slides];
          newSlides[slideIndex] = {
            ...newSlides[slideIndex],
            imageUrl: ''
          };
          return {
            ...prevData,
            slides: newSlides
          };
        });
      }
    } catch (error) {
      console.error('Error uploading banner image:', error);
      alert('Error uploading image: ' + (error.message || 'Unknown error'));
      
      // Reset to empty on error
      setBannerData(prevData => {
        const newSlides = [...prevData.slides];
        newSlides[slideIndex] = {
          ...newSlides[slideIndex],
          imageUrl: ''
        };
        return {
          ...prevData,
          slides: newSlides
        };
      });
    }
  };
  
  // Add URL input for banner images
  const handleBannerImageUrlChange = (slideIndex, url) => {
    if (!url) return;
    
    // Validate URL format
    try {
      // Check if URL is valid and points to an image
      const urlPattern = /^(https?:\/\/)/i;
      if (!urlPattern.test(url)) {
        url = 'https://' + url;
      }
      
      // Update state with the URL
    setBannerData(prevData => {
      const newSlides = [...prevData.slides];
      newSlides[slideIndex] = {
        ...newSlides[slideIndex],
        imageUrl: url
      };
      
      const newData = {
        ...prevData,
        slides: newSlides
      };
      
      // Also update the form data to keep them in sync
      setSectionFormData(prev => ({
        ...prev,
        content: JSON.stringify(newData)
      }));
      
      return newData;
    });
    } catch (error) {
      console.error('Error setting image URL:', error);
      alert('Error setting image URL: ' + (error.message || 'Invalid URL'));
    }
  };
  
  // Handle category data changes
  const handleCategoryChange = (index, field, value) => {
    const updatedCategories = [...categoriesData.categories];
    if (field === 'image' && value instanceof File) {
      // Handle file upload
      const formData = new FormData();
      formData.append('file', value);
      
      // Show loading state
      updatedCategories[index] = {
        ...updatedCategories[index],
        image: 'Uploading...'
      };
      
      // Update state to show loading
      const updatedCategoriesData = { ...categoriesData, categories: updatedCategories };
      setCategoriesData(updatedCategoriesData);
      setSectionFormData(prev => ({
        ...prev,
        content: JSON.stringify(updatedCategoriesData)
      }));
      
      // Upload the file
      homepageSectionService.uploadSectionImage(value, 'categories')
        .then(response => {
          const updatedCategories = [...categoriesData.categories];
          updatedCategories[index] = {
            ...updatedCategories[index],
            image: response.fileUrl
          };
          
          const updatedCategoriesData = { ...categoriesData, categories: updatedCategories };
          setCategoriesData(updatedCategoriesData);
          setSectionFormData(prev => ({
            ...prev,
            content: JSON.stringify(updatedCategoriesData)
          }));
        })
        .catch(error => {
          console.error('Error uploading category image:', error);
          alert('Failed to upload image. Please try again.');
          
          // Reset the image on error
          const updatedCategories = [...categoriesData.categories];
          updatedCategories[index] = {
            ...updatedCategories[index],
            image: ''
          };
          
          const updatedCategoriesData = { ...categoriesData, categories: updatedCategories };
          setCategoriesData(updatedCategoriesData);
          setSectionFormData(prev => ({
            ...prev,
            content: JSON.stringify(updatedCategoriesData)
          }));
        });
    } else {
      // Handle other field changes
    updatedCategories[index] = {
      ...updatedCategories[index],
      [field]: value
      };
    
      const updatedCategoriesData = { ...categoriesData, categories: updatedCategories };
      setCategoriesData(updatedCategoriesData);
    setSectionFormData(prev => ({
      ...prev,
      content: JSON.stringify(updatedCategoriesData)
      }));
  }
  };
  
  // Add handleRemoveCategory function
  const handleRemoveCategory = (index) => {
    const updatedCategories = [...categoriesData.categories];
    updatedCategories.splice(index, 1);
    
    const updatedCategoriesData = { ...categoriesData, categories: updatedCategories };
    setCategoriesData(updatedCategoriesData);
    setSectionFormData(prev => ({
      ...prev,
      content: JSON.stringify(updatedCategoriesData)
    }));
  };
  
  // Load categories when component mounts
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryService.getAllCategories();
        setCategories(response.categories || []);
      } catch (error) {
        console.error('Error loading categories:', error);
        alert('Failed to load categories');
      }
    };
    loadCategories();
  }, []);

  // Add new category
  const handleAddCategory = () => {
    setCategoryFormData({
      id: null,
      name: '',
      description: '',
      parent: '',
      image: null,
      isTrending: false
    });
    setShowCategoryForm(true);
  };

  const handleCategoryFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!categoryFormData.name || !categoryFormData.description) {
        alert('Name and description are required fields');
        return;
      }

      const formData = {
        name: categoryFormData.name,
        description: categoryFormData.description,
        parent: categoryFormData.parent || null,
        image: categoryFormData.image,
        isTrending: categoryFormData.isTrending || false
      };

      let response;
      if (categoryFormData.id) {
        response = await categoryService.updateCategory(categoryFormData.id, formData);
      } else {
        response = await categoryService.createCategory(formData);
      }

      // Update categories list
      const categoriesData = await categoryService.getAllCategories();
      setCategories(categoriesData.categories || []);

      // Reset form
      setCategoryFormData({
        id: null,
        name: '',
        description: '',
        parent: '',
        image: null,
        isTrending: false
      });
      setShowCategoryForm(false);

      alert(`Category ${categoryFormData.id ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error submitting category:', error);
      alert(error.response?.data?.message || 'Error submitting category');
    }
  };

  const handleCategoryImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setCategoryFormData({
          ...categoryFormData,
          image: file
        });
      } else {
        alert('Please upload an image file');
        e.target.value = '';
      }
    }
  };

  // Add function to handle product search
  const handleProductSearch = (e) => {
    setProductSearch(e.target.value);
    setIsSearching(true);
    
    const searchTerm = e.target.value.trim().toLowerCase();
    
    if (searchTerm === '') {
      // If search is cleared, show all products
      setSearchResults(allProducts);
      setIsSearching(false);
      return;
    }
    
    // Filter products locally
    const filteredProducts = allProducts.filter(product => 
      product.name.toLowerCase().includes(searchTerm)
    );
    
    setSearchResults(filteredProducts);
    setIsSearching(false);
  };

  // Add function to handle product selection
  const handleProductSelect = (productId) => {
    setSelectedProducts(prevSelected => {
      const newSelected = prevSelected.includes(productId)
        ? prevSelected.filter(id => id !== productId)
        : [...prevSelected, productId];
      
      // Update productsData and sectionFormData
      const newProductsData = { productIds: newSelected };
      setProductsData(newProductsData);
      setSectionFormData(prev => ({
        ...prev,
        content: JSON.stringify(newProductsData)
      }));
      
      return newSelected;
    });
  };

  // Add function to handle product deselection
  const handleProductDeselect = (productId) => {
    setSelectedProducts(prevSelected => {
      const newSelected = prevSelected.filter(id => id !== productId);
      
      // Update productsData and sectionFormData
      const newProductsData = { productIds: newSelected };
      setProductsData(newProductsData);
      setSectionFormData(prev => ({
        ...prev,
        content: JSON.stringify(newProductsData)
      }));
      
      return newSelected;
    });
  };

  // Update handleSectionFormSubmit to use real API
  const handleSectionFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Process the content based on section type
      let processedContent = {}; // Default to empty object
      
      if (sectionFormData.type === "banner") {
        // Ensure bannerData has proper structure with slides array
        console.log('Banner data before submission:', bannerData);
        // Make sure we're sending the proper format with slides array
        processedContent = {
          slides: Array.isArray(bannerData.slides) ? bannerData.slides : [bannerData.slides]
        };
        console.log('Processed banner content:', processedContent);
      } else if (sectionFormData.type === "categories") {
        // Use categoriesData directly
        processedContent = categoriesData;
      } else if (sectionFormData.type === "products") {
        // Use productsData directly
        processedContent = {
          productIds: selectedProducts
        };
        // Add debugging logs
        console.log('Submitting products data:', {
          selectedProducts,
          processedContent
        });
      } else if (sectionFormData.type === "icon-categories") {
        // Process iconCategoriesData to ensure it has proper structure
        if (iconCategoriesData && iconCategoriesData.categories) {
          processedContent = {
            categories: iconCategoriesData.categories.map(cat => ({
              name: cat.name || '',
              imageUrl: cat.imageUrl || '',
              link: cat.link || ''
            }))
          };
        } else {
          // Handle case where iconCategoriesData is malformed
          try {
            const content = typeof sectionFormData.content === 'string' 
              ? JSON.parse(sectionFormData.content) 
              : sectionFormData.content || {};
              
            processedContent = {
              categories: Array.isArray(content.categories) ? content.categories : []
            };
          } catch (error) {
            console.error('Error parsing icon-categories content:', error);
            processedContent = { categories: [] };
          }
        }
      } else {
        // Handle custom or other section types
        if (typeof sectionFormData.content === 'string') {
          try {
            // Try to parse string content as JSON
            processedContent = JSON.parse(sectionFormData.content);
          } catch (error) {
            console.error('Error parsing content:', error);
            // If parsing fails, use as is
            processedContent = { content: sectionFormData.content };
          }
        } else if (sectionFormData.content) {
          // Use content directly if it's already an object
          processedContent = sectionFormData.content;
        }
      }
      
      // Prepare the section data
      const sectionData = {
        title: sectionFormData.title,
        type: sectionFormData.type,
        content: processedContent,
        order: parseInt(sectionFormData.order),
        active: sectionFormData.active,
      };
      
      console.log('Submitting section data:', sectionData);
      
      let response;
      
      if (sectionFormData.id) {
        // Update existing section
        try {
          console.log(`Sending update request for section ID: ${sectionFormData.id}`, sectionData);
          response = await homepageSectionService.updateSection(sectionFormData.id, sectionData);
          console.log('Section updated:', response);
          
          // Update local state with the response from the server
          setHomePageSections(prevSections => 
            prevSections.map(section => 
              (section.id === sectionFormData.id || section._id === sectionFormData.id) 
                ? response 
                : section
            )
          );
          
          // Also update localStorage
          const updatedSections = homePageSections.map(section => 
            (section.id === sectionFormData.id || section._id === sectionFormData.id) 
              ? response 
              : section
          );
          localStorage.setItem('homePageSections', JSON.stringify(updatedSections));
          console.log('Updated localStorage after section update');
          
        } catch (apiError) {
          console.error('API error updating section:', apiError);
          const errorMessage = apiError.response?.data?.message || apiError.message;
          const errorDetails = apiError.response?.data?.error || '';
          alert(`Failed to update section: ${errorMessage}${errorDetails ? `\nDetails: ${errorDetails}` : ''}`);
          return;
        }
      } else {
        // Create new section
        try {
          console.log('Sending create request for new section:', sectionData);
          response = await homepageSectionService.createSection(sectionData);
          console.log('Section created:', response);
          
          // Update local state with the response from the server
          setHomePageSections(prevSections => [...prevSections, response]);
          
          // Also update localStorage
          const updatedSections = [...homePageSections, response];
          localStorage.setItem('homePageSections', JSON.stringify(updatedSections));
          console.log('Updated localStorage after section creation');
          
        } catch (apiError) {
          console.error('API error creating section:', apiError);
          const errorMessage = apiError.response?.data?.message || apiError.message;
          const errorDetails = apiError.response?.data?.error || '';
          alert(`Failed to create section: ${errorMessage}${errorDetails ? `\nDetails: ${errorDetails}` : ''}`);
          return;
        }
      }
      
      // Reset form and states
      setShowSectionForm(false);
      setBannerData({
        slides: [
          {
            imageUrl: "",
            title: "",
            subtitle: "",
            buttonText: "",
            buttonLink: "",
          }
        ]
      });
      
      setCategoriesData({
        categories: [],
      });
      
      setProductsData({
        productIds: [],
      });
      
      setSelectedProducts([]);
      
      setIconCategoriesData({
        categories: [],
      });
    } catch (error) {
      console.error('Error saving section:', error);
      alert('Failed to save section: ' + error.message);
    }
  };

  // Helper function to safely parse JSON
  const safeJsonParse = (jsonString, defaultValue = {}) => {
    // If it's already an object, return it directly
    if (typeof jsonString === 'object' && jsonString !== null) {
      return jsonString;
    }
    
    // Otherwise try to parse it as JSON
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return defaultValue;
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Update refs when categories change
  useEffect(() => {
    // Initialize refs array with the correct length
    categoryFileInputRefs.current = Array(categoriesData.categories.length)
      .fill()
      .map((_, i) => categoryFileInputRefs.current[i] || React.createRef())
  }, [categoriesData.categories.length])

  // Update handleIconCategoryChange to use imageUrl instead of icon
  const handleIconCategoryChange = (index, field, value) => {
    // Update the iconCategoriesData state
    const newCategories = [...iconCategoriesData.categories];
    newCategories[index] = {
      ...newCategories[index],
      [field]: value
    };
    
    setIconCategoriesData({
      categories: newCategories
    });
    
    // Update the section form data with the new content
    setSectionFormData(prev => ({
      ...prev,
      content: JSON.stringify({
        categories: newCategories
      })
    }));
  };
  
  // Update handleIconCategoryImageUpload to use FormData for real upload
  const handleIconCategoryImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Show loading indicator or message
      const newCategories = [...iconCategoriesData.categories];
      newCategories[index] = {
        ...newCategories[index],
        imageUrl: 'Uploading...' // Temporary placeholder
      };
      
      setIconCategoriesData({
        categories: newCategories
      });
      
      // Upload the image to Cloudinary
      const response = await homepageSectionService.uploadSectionImage(file, 'icon-categories');
      
      if (response && response.fileUrl) {
        // Update the iconCategoriesData with the Cloudinary URL
        const updatedCategories = [...iconCategoriesData.categories];
        updatedCategories[index] = {
          ...updatedCategories[index],
          imageUrl: response.fileUrl,
          public_id: response.public_id
        };
        
        setIconCategoriesData({
          categories: updatedCategories
        });
        
        // Update the section form data with the new content
        setSectionFormData(prev => ({
          ...prev,
          content: JSON.stringify({
            categories: updatedCategories
          })
        }));
      } else {
        console.error('Failed to upload image:', response);
        alert('Failed to upload image. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading category image:', error);
      alert('Error uploading image: ' + (error.message || 'Unknown error'));
      
      // Reset the image URL on error
      const newCategories = [...iconCategoriesData.categories];
      newCategories[index] = {
        ...newCategories[index],
        imageUrl: ''
      };
      setIconCategoriesData({
        categories: newCategories
      });
    }
  };
  
  // Add function to remove an icon category
  const handleRemoveIconCategory = (index) => {
    const updatedCategories = [...iconCategoriesData.categories];
    updatedCategories.splice(index, 1);
    
    setIconCategoriesData({
      categories: updatedCategories
    });
    
    // Update the section form data with the new content
    setSectionFormData(prev => ({
      ...prev,
      content: JSON.stringify({
        categories: updatedCategories
      })
    }));
  };

  // Add function to add a new icon category
  const handleAddIconCategory = () => {
    const newCategory = {
      name: '',
      imageUrl: '',
      link: ''
    };
    
    setIconCategoriesData(prev => ({
      categories: [...prev.categories, newCategory]
    }));
    
    // Update the section form data with the new content
    setSectionFormData(prev => ({
      ...prev,
      content: JSON.stringify({
        categories: [...iconCategoriesData.categories, newCategory]
      })
    }));
  };

  // Load all products when component mounts
  useEffect(() => {
    const loadAllProducts = async () => {
      try {
        const response = await productService.getAllProducts();
        if (response && response.products) {
          // Format the products for display
          const formattedProducts = response.products.map(product => ({
            id: product._id,
            name: product.title || product.name,
            price: product.price || 0,
            image: product.images && product.images.length > 0 
              ? product.images[0] 
              : '/placeholder-image.png',
            soldCount: product.soldCount || 0
          }));
          setAllProducts(formattedProducts);
          // Initially show all products
          setSearchResults(formattedProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    
    loadAllProducts();
  }, []);

  const handleApproveApplication = async (applicationId) => {
    try {
      await authService.approveSellerApplication(applicationId);
      // Remove from applications list
      setSellerApplications(sellerApplications.filter(app => app._id !== applicationId));
      // Refresh sellers list
      const sellersResponse = await authService.getSellers();
      setSellers(sellersResponse.data || []);
      alert('Seller application approved successfully!');
    } catch (error) {
      console.error('Error approving seller application:', error);
      alert('Failed to approve seller application');
    }
  };

  const handleRejectApplication = async (applicationId) => {
    try {
      await authService.rejectSellerApplication(applicationId);
      setSellerApplications(sellerApplications.filter(app => app._id !== applicationId));
      alert('Seller application rejected successfully!');
    } catch (error) {
      console.error('Error rejecting seller application:', error);
      alert('Failed to reject seller application');
    }
  };

  const handleVerifySeller = async (sellerId, isVerified) => {
    try {
      const response = await authService.updateSellerVerification(sellerId, isVerified);
      // Update the sellers list with the updated seller
      setSellers(sellers.map(seller => 
        seller._id === sellerId ? response.seller : seller
      ));
      alert(`Seller ${isVerified ? 'verified' : 'unverified'} successfully!`);
    } catch (error) {
      console.error('Error updating seller verification:', error);
      alert('Failed to update seller verification status');
    }
  };

  const handleViewSellerDetails = (seller) => {
    setSelectedSeller(seller);
    setShowSellerModal(true);
  };

  const handleEditCategory = (category) => {
    setCategoryFormData({
      id: category._id,
      name: category.name,
      description: category.description,
      parent: category.parent || '',
      image: null,
      isTrending: category.isTrending || false
    });
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoryService.deleteCategory(categoryId);
        setCategories(categories.filter(cat => cat._id !== categoryId));
        alert('Category deleted successfully!');
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category. Please try again.');
      }
    }
  };

  // Add handleLogout function
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Add function to toggle user status
  const handleToggleUserStatus = async (userId, isActive) => {
    try {
      await userService.updateUserStatus(userId, isActive);
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isActive } : user
      ));
      alert(`User ${isActive ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  if (isLoading) {
    return (
      <div className="admin-dashboard loading">
        <div className="container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard-layout">
      {/* Left Navigation */}
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Admin Panel</h2>
          <p>Welcome, {user?.username || "Admin"}</p>
        </div>
        
        <nav className="admin-nav">
          <button
            className={`nav-btn ${activeTab === "homepage" ? "active" : ""}`}
            onClick={() => handleTabChange("homepage")}
          >
            Homepage Editor
          </button>
          <button
            className={`nav-btn ${activeTab === "categories" ? "active" : ""}`}
            onClick={() => handleTabChange("categories")}
          >
            <FaLayerGroup /> Categories
          </button>
          <button
            className={`nav-btn ${activeTab === "users" ? "active" : ""}`}
            onClick={() => handleTabChange("users")}
          >
            <FaUsers /> Users
          </button>
          <button
            className={`nav-btn ${activeTab === "products" ? "active" : ""}`}
            onClick={() => handleTabChange("products")}
          >
            <FaBox /> Products
          </button>
          <button
            className={`nav-btn ${activeTab === "sellers" ? "active" : ""}`}
            onClick={() => handleTabChange("sellers")}
          >
            <FaUsers /> Sellers
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="admin-main-content">
        <div className="tab-content">
          {activeTab === "homepage" && (
            <div className="homepage-tab">
              <div className="tab-header">
                <h2>Homepage Sections</h2>
                <div className="tab-actions">
                  <button className="reset-btn" onClick={() => {
                    if (window.confirm("Are you sure you want to reset all homepage sections to defaults? This cannot be undone.")) {
                      localStorage.removeItem('homePageSections');
                      localStorage.removeItem('sectionMongoIds');
                      fetchData();
                    }
                  }}>
                    Reset to Defaults
                  </button>
                  <button className="delete-all-btn" onClick={() => {
                    if (window.confirm("⚠️ WARNING: Are you sure you want to delete ALL sections? This will empty both the database and localStorage.")) {
                      // Clear localStorage
                      localStorage.removeItem('homePageSections');
                      localStorage.removeItem('sectionMongoIds');
                      
                      // Clear database sections - delete each one by ID
                      const deletePromises = homePageSections.map(section => {
                        const sectionId = section._id || section.id;
                        if (sectionId) {
                          return homepageSectionService.deleteSection(sectionId)
                            .catch(err => console.error(`Failed to delete section ${sectionId}:`, err));
                        }
                        return Promise.resolve();
                      });
                      
                      // After all deletes complete
                      Promise.all(deletePromises)
                        .then(() => {
                          // Set empty array to clear UI
                          setHomePageSections([]);
                          alert("All sections have been deleted.");
                        })
                        .catch(err => {
                          console.error("Error during mass deletion:", err);
                          // Still clear local state
                          setHomePageSections([]);
                        });
                    }
                  }} style={{ marginRight: "10px", background: "#d9534f", color: "white" }}>
                    Delete All
                  </button>
                  <button className="add-btn" onClick={handleAddSection}>
                    Add New Section
                  </button>
                </div>
              </div>

              <div className="sections-list">
                {homePageSections
                  .sort((a, b) => a.order - b.order)
                  .map((section) => (
                    <div 
                      key={section._id} 
                      className={`section-item ${!section.active ? "inactive" : ""}`}
                      data-id={section._id}
                      data-order={section.order}
                    >
                      <div className="section-info">
                        <h3>{section.title}</h3>
                        <div className="section-meta">
                          <span className="section-type">{section.type}</span>
                          <span className="section-order">Order: {section.order}</span>
                        </div>
                        
                        {/* Preview based on section type */}
                        <div className="section-preview">
                          {section.type === "banner" && (
                            <div className="banner-preview">
                              {(() => {
                                const content = safeJsonParse(section.content);
                                // Handle both old format and new slides format
                                const image = content.slides ? 
                                  (content.slides[0]?.imageUrl || "/placeholder.svg") : 
                                  (content.image || "/placeholder.svg");
                                const title = content.slides ? 
                                  (content.slides[0]?.title || "Banner Title") : 
                                  (content.title || "Banner Title");
                                const subtitle = content.slides ? 
                                  (content.slides[0]?.subtitle || "Banner Subtitle") : 
                                  (content.subtitle || "Banner Subtitle");
                                
                                return (
                                  <>
                                    <img src={image} alt="Banner preview" className="preview-image" />
                              <div className="banner-text-preview">
                                      <h4>{title}</h4>
                                      <p>{subtitle}</p>
                              </div>
                                    {content.slides && content.slides.length > 1 && (
                                      <div className="slides-count">+{content.slides.length - 1} more slides</div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          )}
                          
                          {section.type === "categories" && (
                            <div className="categories-preview">
                              {(() => {
                                const content = safeJsonParse(section.content);
                                const categories = content.categories || [];
                                
                                return (
                                  <>
                                    {categories.slice(0, 3).map((cat, idx) => (
                                <div key={idx} className="category-item-preview">
                                        <img 
                                          src={cat.image || cat.imageUrl || "/placeholder.svg"} 
                                          alt={cat.name} 
                                          className="preview-image-small" 
                                        />
                                  <span>{cat.name || "Category"}</span>
                                </div>
                              ))}
                                    {categories.length > 3 && 
                                      <span>+{categories.length - 3} more</span>
                              }
                                    {categories.length === 0 && 
                                <span>No categories added</span>
                              }
                                  </>
                                );
                              })()}
                            </div>
                          )}
                          
                          {section.type === "products" && (
                            <div className="products-preview">
                              {(() => {
                                const content = safeJsonParse(section.content);
                                const productIds = content.productIds || [];
                                
                                return (
                                  <span>{productIds.length} products selected</span>
                                );
                              })()}
                            </div>
                          )}
                          
                          {section.type === "icon-categories" && (
                            <div className="icon-categories-preview">
                              {(() => {
                                const content = safeJsonParse(section.content);
                                const categories = content.categories || [];
                                
                                return (
                                  <>
                                    {categories.slice(0, 4).map((cat, idx) => (
                                <div key={idx} className="icon-category-item-preview">
                                        {cat.imageUrl ? (
                                          <img src={cat.imageUrl} alt={cat.name} className="preview-image-small" />
                                        ) : (
                                  <div className="preview-icon">{cat.icon || "🏷️"}</div>
                                        )}
                                  <span>{cat.name || "Category"}</span>
                                </div>
                              ))}
                                    {categories.length > 4 && 
                                      <span>+{categories.length - 4} more</span>
                              }
                                    {categories.length === 0 && 
                                <span>No categories added</span>
                              }
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="section-actions">
                        <button
                          className={`toggle-btn ${section.active ? "active" : "inactive"}`}
                          onClick={() => handleToggleSection(section._id)}
                        >
                          {section.active ? "Active" : "Inactive"}
                        </button>
                        <button className="edit-btn" onClick={() => handleEditSection(section)}>
                          Edit
                        </button>
                        <button className="delete-btn" onClick={() => handleDeleteSection(section._id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === "categories" && (
            <div className="categories-tab">
              <div className="tab-header">
                <h2>Categories Management</h2>
                <button className="btn-primary" onClick={() => setShowCategoryForm(true)}>
                  Add New Category
                </button>
              </div>

              {showCategoryForm && (
                <div className="modal">
                  <div className="modal-content">
                    <h3>{categoryFormData.id ? 'Edit Category' : 'Add New Category'}</h3>
                    <form onSubmit={handleCategoryFormSubmit}>
                      <div className="form-group">
                        <label>Name</label>
                        <input
                          type="text"
                          value={categoryFormData.name}
                          onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          value={categoryFormData.description}
                          onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})}
                          required
                        ></textarea>
                      </div>
                      <div className="form-group">
                        <label>Parent Category</label>
                        <select
                          value={categoryFormData.parent}
                          onChange={(e) => setCategoryFormData({...categoryFormData, parent: e.target.value})}
                        >
                          <option value="">None</option>
                          {categories.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCategoryImageChange}
                        />
                        {categoryFormData.image && (
                          <div className="image-preview">
                            <img
                              src={categoryFormData.image instanceof File ? URL.createObjectURL(categoryFormData.image) : categoryFormData.image.url}
                              alt="Category preview"
                            />
                          </div>
                        )}
                      </div>
                      <div className="form-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={categoryFormData.isTrending}
                            onChange={(e) => setCategoryFormData({...categoryFormData, isTrending: e.target.checked})}
                          />
                          Mark as Trending
                        </label>
                      </div>
                      <div className="form-actions">
                        <button type="submit" className="btn-primary">
                          {categoryFormData.id ? 'Update Category' : 'Create Category'}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setShowCategoryForm(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="categories-list">
                {categories.map(category => (
                  <div key={category._id} className="category-item">
                    <div className="category-info">
                      {category.image?.url && (
                        <img
                          src={category.image.url}
                          alt={category.name}
                          className="category-image"
                        />
                      )}
                      <div className="category-details">
                        <h4>{category.name}</h4>
                        <p>{category.description}</p>
                        {category.parent && (
                          <p className="parent-category">
                            Parent: {categories.find(c => c._id === category.parent)?.name}
                          </p>
                        )}
                        {category.isTrending && (
                          <span className="trending-badge">Trending</span>
                        )}
                      </div>
                    </div>
                    <div className="category-actions">
                      <button
                        className="btn-secondary"
                        onClick={() => handleEditCategory(category)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => handleDeleteCategory(category._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="users-tab">
              <div className="tab-header">
                <h2>Customer Management</h2>
              </div>

              <div className="section-container">
                <h3>Registered Customers</h3>
                <div className="users-list">
                  {users.map(user => (
                    <div key={user._id} className="user-item">
                      <div className="user-info">
                        <h4>{user.username}</h4>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                        <p><strong>Status:</strong> {user.isActive ? 'Active' : 'Inactive'}</p>
                      </div>
                      <div className="user-actions">
                        {user.isActive ? (
                          <button 
                            className="deactivate-btn"
                            onClick={() => handleToggleUserStatus(user._id, false)}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button 
                            className="activate-btn"
                            onClick={() => handleToggleUserStatus(user._id, true)}
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <p className="no-data">No registered customers found</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="products-tab">
              <h2>Product Management</h2>

              <div className="products-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Price</th>
                      <th>Seller</th>
                      <th>Category</th>
                      <th>Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(products || []).map((product) => (
                      <tr key={product._id}>
                        <td>{product._id}</td>
                        <td>{product.title}</td>
                        <td>Rs. {(product.price).toFixed(2)}</td>
                        <td>{product.seller?.username || 'Unknown'}</td>
                        <td>{product.category?.name || 'Uncategorized'}</td>
                        <td>{formatDate(product.createdAt)}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="edit-btn">
                              <FaEdit /> Edit
                            </button>
                            <button className="delete-btn">
                              <FaTrash /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "sellers" && (
            <div className="sellers-tab">
              <div className="tab-header">
                <h2>Seller Management</h2>
              </div>

              <div className="section-container">
                <h3>Pending Seller Applications</h3>
                <div className="applications-list">
                  {sellerApplications.map(application => (
                    <div key={application._id} className="application-item">
                      <div className="application-info">
                        <h4>{application.storeName}</h4>
                        <p><strong>Applicant:</strong> {application.user.username}</p>
                        <p><strong>Email:</strong> {application.user.email}</p>
                        <p><strong>Phone:</strong> {application.phoneNumber}</p>
                        <p><strong>Submitted:</strong> {new Date(application.createdAt).toLocaleDateString()}</p>
                        <p><strong>Business Description:</strong> {application.storeDescription}</p>
                        <p><strong>Address:</strong> {application.address.street}, {application.address.city}, {application.address.country}</p>
                      </div>
                      <div className="application-documents">
                        <h5>Verification Documents</h5>
                        <div className="document-list">
                          {application.documents.map((doc, index) => (
                            <a 
                              key={index} 
                              href={doc} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="document-link"
                            >
                              Document {index + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                      <div className="application-actions">
                        <button 
                          className="approve-btn"
                          onClick={() => handleApproveApplication(application._id)}
                        >
                          Approve
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => handleRejectApplication(application._id)}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                  {sellerApplications.length === 0 && (
                    <p className="no-data">No pending seller applications</p>
                  )}
                </div>

                <h3>Verified Sellers</h3>
                <div className="sellers-list">
                  {sellers.filter(seller => seller?.sellerProfile?.isVerified).map(seller => (
                    <div key={seller._id} className="seller-item">
                      <div className="seller-info">
                        <h4>{seller.sellerProfile.storeName}</h4>
                        <p><strong>Username:</strong> {seller.username}</p>
                        <p><strong>Email:</strong> {seller.email}</p>
                        <p><strong>Total Sales:</strong> {seller.sellerProfile.totalSales || 0}</p>
                        <p><strong>Rating:</strong> {seller.sellerProfile.rating || 'No ratings yet'}</p>
                      </div>
                      <div className="seller-actions">
                        <button 
                          className="unverify-btn"
                          onClick={() => handleVerifySeller(seller._id, false)}
                        >
                          Unverify Seller
                        </button>
                      </div>
                    </div>
                  ))}
                  {sellers.filter(seller => seller?.sellerProfile?.isVerified).length === 0 && (
                    <p className="no-data">No verified sellers found</p>
                  )}
                </div>

                <h3>Unverified Sellers</h3>
                <div className="sellers-list">
                  {sellers.filter(seller => !seller?.sellerProfile?.isVerified).map(seller => (
                    <div key={seller._id} className="seller-item">
                      <div className="seller-info">
                        <h4>{seller.sellerProfile.storeName}</h4>
                        <p><strong>Username:</strong> {seller.username}</p>
                        <p><strong>Email:</strong> {seller.email}</p>
                        <p><strong>Joined:</strong> {new Date(seller.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="seller-actions">
                        <button 
                          className="verify-btn"
                          onClick={() => handleVerifySeller(seller._id, true)}
                        >
                          Verify Seller
                        </button>
                      </div>
                    </div>
                  ))}
                  {sellers.filter(seller => !seller?.sellerProfile?.isVerified).length === 0 && (
                    <p className="no-data">No unverified sellers found</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showSectionForm && (
        <div className="section-form-modal">
          <div className="section-form-content">
            <button className="close-form-btn" onClick={() => setShowSectionForm(false)}>×</button>
            <h2>{sectionFormData.id ? 'Edit Section' : 'Add New Section'}</h2>
            
            <form onSubmit={handleSectionFormSubmit}>
              <div className="form-group">
                <label>Title*</label>
                <input
                  type="text"
                  name="title"
                  value={sectionFormData.title}
                  onChange={handleSectionFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Type*</label>
                <select 
                  name="type"
                  value={sectionFormData.type}
                  onChange={handleSectionFormChange}
                  required
                >
                  <option value="banner">Banner</option>
                  <option value="categories">Categories</option>
                  <option value="products">Products</option>
                  <option value="icon-categories">Icon Categories</option>
                </select>
              </div>

              <div className="form-group">
                <label>Order*</label>
                <input
                  type="number"
                  name="order"
                  value={sectionFormData.order}
                  onChange={handleSectionFormChange}
                  min="1"
                  required
                />
              </div>

              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="active"
                    checked={sectionFormData.active}
                    onChange={handleSectionFormChange}
                  />
                  Active
                </label>
              </div>

              {/* Dynamic form fields based on section type */}
              {sectionFormData.type === "banner" && (
                <div className="banner-form">
                  {bannerData.slides.map((slide, index) => (
                    <div key={index} className="banner-slide">
                      <h3>Slide {index + 1}</h3>
                      <div className="form-group">
                        <label>Image*</label>
                        <div className="image-upload-group">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleBannerImageUpload(index, e)}
                            className="image-upload-input"
                          />
                          <span className="or-divider">OR</span>
                          <input
                            type="text"
                            value={slide.imageUrl}
                            onChange={(e) => handleBannerChange(index, 'imageUrl', e.target.value)}
                            placeholder="Enter image URL"
                            className="image-url-input"
                          />
                        </div>
                        {slide.imageUrl && (
                          <div className="image-preview">
                            <img src={slide.imageUrl} alt={`Slide ${index + 1}`} />
                          </div>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Title</label>
                        <input
                          type="text"
                          value={slide.title}
                          onChange={(e) => handleBannerChange(index, 'title', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Subtitle</label>
                        <input
                          type="text"
                          value={slide.subtitle}
                          onChange={(e) => handleBannerChange(index, 'subtitle', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Button Text</label>
                        <input
                          type="text"
                          value={slide.buttonText}
                          onChange={(e) => handleBannerChange(index, 'buttonText', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Button Link</label>
                        <input
                          type="text"
                          value={slide.buttonLink}
                          onChange={(e) => handleBannerChange(index, 'buttonLink', e.target.value)}
                        />
                      </div>
                      {bannerData.slides.length > 1 && (
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => handleRemoveBannerSlide(index)}
                        >
                          Remove Slide
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleAddBannerSlide}
                  >
                    Add Slide
                  </button>
                </div>
              )}

              {sectionFormData.type === "categories" && (
                <div className="categories-form">
                  <div className="form-group">
                    <label>Select Categories</label>
                    <select
                      multiple
                      value={categoriesData.categories.map(cat => cat.id)}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions, option => ({
                          id: option.value,
                          name: option.text
                        }));
                        setCategoriesData({ categories: selectedOptions });
                        setSectionFormData(prev => ({
                          ...prev,
                          content: JSON.stringify({ categories: selectedOptions })
                        }));
                      }}
                    >
                      {categories.map(category => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {sectionFormData.type === "products" && (
                <div className="products-form">
                  <div className="form-group">
                    <label>Search Products</label>
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        const searchTerm = e.target.value.toLowerCase();
                        setSearchResults(
                          allProducts.filter(product =>
                            product.name.toLowerCase().includes(searchTerm)
                          )
                        );
                      }}
                      placeholder="Type to search products..."
                    />
                  </div>

                  <div className="search-results">
                    {searchResults.map(product => (
                      <div
                        key={product.id}
                        className={`search-result-item ${selectedProducts.includes(product.id) ? 'selected' : ''}`}
                        onClick={() => handleProductSelect(product.id)}
                      >
                        <img src={product.image} alt={product.name} />
                        <span>{product.name}</span>
                        <span className="price">Rs. {product.price}</span>
                      </div>
                    ))}
                  </div>

                  <div className="selected-products">
                    <h4>Selected Products</h4>
                    {selectedProducts.map(productId => {
                      const product = allProducts.find(p => p.id === productId);
                      return product ? (
                        <div key={productId} className="selected-product">
                          <img src={product.image} alt={product.name} />
                          <span>{product.name}</span>
                          <button
                            type="button"
                            onClick={() => handleProductDeselect(productId)}
                          >
                            Remove
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {sectionFormData.type === "icon-categories" && (
                <div className="icon-categories-form">
                  {iconCategoriesData.categories.map((category, index) => (
                    <div key={index} className="icon-category-item">
                      <div className="form-group">
                        <label>Name*</label>
                        <input
                          type="text"
                          value={category.name}
                          onChange={(e) => handleIconCategoryChange(index, 'name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Image URL*</label>
                        <input
                          type="text"
                          value={category.imageUrl}
                          onChange={(e) => handleIconCategoryChange(index, 'imageUrl', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Link*</label>
                        <input
                          type="text"
                          value={category.link}
                          onChange={(e) => handleIconCategoryChange(index, 'link', e.target.value)}
                          required
                        />
                      </div>
                      <button
                        type="button"
                        className="remove-category-btn"
                        onClick={() => handleRemoveIconCategory(index)}
                      >
                        Remove Category
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="add-category-btn"
                    onClick={handleAddIconCategory}
                  >
                    Add Category
                  </button>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowSectionForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {sectionFormData.id ? 'Update Section' : 'Add Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
