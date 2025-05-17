"use client"

import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import homepageSectionService from "../services/api/homepageSectionService"
import productService from "../services/api/productService"
import "./AdminDashboard.css"

const AdminDashboard = () => {
  const { user } = useAuth()
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
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    // Check if user is an admin
    if (!user || user.role !== "admin") {
      navigate("/login")
      return
    }

    // Fetch admin data
    fetchAdminData()
  }, [user, navigate])

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

  const fetchAdminData = async () => {
    setIsLoading(true)
    try {
      // Fetch homepage sections from API
      try {
        const sections = await homepageSectionService.getAdminSections();
        if (sections && sections.length > 0) {
          console.log('Loaded homepage sections from API:', sections);
          setHomePageSections(sections);
          
          // Also update localStorage with latest from server
          localStorage.setItem('homePageSections', JSON.stringify(sections));
          console.log('Updated localStorage with latest sections from API');
          
          // Store mapping of order to MongoDB IDs
          const idsMap = {};
          sections.forEach(section => {
            if (section._id && section.order) {
              idsMap[section.order] = section._id;
            }
          });
          localStorage.setItem('sectionMongoIds', JSON.stringify(idsMap));
        } else {
          // No sections from API - check if we should use localStorage or defaults
          const shouldUseDefaults = window.confirm(
            "No sections found in database. Would you like to reset to default sections? " +
            "Click OK to use defaults, or Cancel to use any locally saved sections."
          );
          
          if (shouldUseDefaults) {
            // Clear localStorage and use defaults
            localStorage.removeItem('homePageSections');
            localStorage.removeItem('sectionMongoIds');
            const defaultSections = getDefaultSections();
            setHomePageSections(defaultSections);
          } else {
            // Try localStorage as fallback
            const savedSections = localStorage.getItem('homePageSections');
            if (savedSections) {
              try {
                const parsedSections = JSON.parse(savedSections);
                console.log('Loaded homepage sections from localStorage:', parsedSections);
                setHomePageSections(parsedSections);
              } catch (error) {
                console.error('Error parsing saved sections:', error);
                // Use default sections if parsing fails
                setHomePageSections(getDefaultSections());
              }
            } else {
              // No localStorage data either - use defaults
              setHomePageSections(getDefaultSections());
            }
          }
        }
      } catch (error) {
        console.error('Error fetching homepage sections:', error);
        
        // Ask user what to do
        const shouldUseDefaults = window.confirm(
          "Error connecting to database. Would you like to reset to default sections? " +
          "Click OK to use defaults, or Cancel to use any locally saved sections."
        );
        
        if (shouldUseDefaults) {
          // Clear localStorage and use defaults
          localStorage.removeItem('homePageSections');
          localStorage.removeItem('sectionMongoIds');
          const defaultSections = getDefaultSections();
          setHomePageSections(defaultSections);
        } else {
          // Try localStorage as fallback
          const savedSections = localStorage.getItem('homePageSections');
          if (savedSections) {
            try {
              const parsedSections = JSON.parse(savedSections);
              console.log('Loaded homepage sections from localStorage:', parsedSections);
              setHomePageSections(parsedSections);
            } catch (error) {
              console.error('Error parsing saved sections:', error);
              setHomePageSections(getDefaultSections());
            }
          } else {
            setHomePageSections(getDefaultSections());
          }
        }
      }

      // Mock users and products data for the demo
      // In a real app, you would fetch these from the API
        const mockUsers = [
          {
            id: 1,
            email: "user@example.com",
            username: "User",
            role: "user",
            createdAt: new Date(Date.now() - 5000000000).toISOString(),
          },
        // ... rest of mock users
        ]
        setUsers(mockUsers)

        const mockProducts = Array(5)
          .fill()
          .map((_, index) => ({
            id: index + 1,
            title: `Product ${index + 1}`,
            price: 9999,
            seller: "Seller",
            category: "Home & Decor",
            createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
          }))
        setProducts(mockProducts)

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
      type: section.type
    });
    
    setSectionFormData({
      id: sectionId,  // Prefer MongoDB _id
      title: section.title,
      type: section.type,
      content: typeof section.content === 'string' ? section.content : JSON.stringify(section.content),
      order: section.order,
      active: section.active,
    });

    // Parse content for specific section types
    let contentObj;
    try {
      contentObj = typeof section.content === 'string' ? JSON.parse(section.content) : section.content;
    } catch (error) {
      console.error("Error parsing section content:", error);
      return;
    }
      
      if (section.type === "banner") {
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
      } else if (section.type === "categories") {
      setCategoriesData(contentObj);
      } else if (section.type === "products") {
      setProductsData(contentObj);
      // If we have product IDs, populate selectedProducts
      if (contentObj.productIds && Array.isArray(contentObj.productIds)) {
        setSelectedProducts(contentObj.productIds);
      } else {
        setSelectedProducts([]);
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

      // Upload the file to the server
      console.log(`Starting upload for file: ${file.name} (${file.size} bytes)`);
      const uploadResponse = await homepageSectionService.uploadSectionImage(file, 'banner');
      
      console.log('Upload complete. Response:', uploadResponse);
      
      if (uploadResponse && uploadResponse.fileUrl) {
        console.log(`Banner image uploaded successfully to ${uploadResponse.fileUrl}`);
        
        // Choose the best URL option available
        let imageUrl = uploadResponse.fileUrl;
        
        // Log all available URLs for debugging
        if (uploadResponse.allUrls) {
          console.log('All available URLs:', uploadResponse.allUrls);
        }
        
        // Show additional info about the file
        if (uploadResponse.fullPath) {
          console.log('File saved at:', uploadResponse.fullPath);
        }
        
        console.log('Using image URL:', imageUrl);
        
        // Update the banner data with the new image URL
        setBannerData(prevData => {
          const newSlides = [...prevData.slides];
          newSlides[slideIndex] = {
            ...newSlides[slideIndex],
            imageUrl: imageUrl
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
          
          console.log('Updated slide image at index', slideIndex, 'with URL:', imageUrl);
          return newData;
        });
        
        // Test image loading directly
        try {
          const testImg = new Image();
          testImg.onload = () => console.log('Image verified to load successfully');
          testImg.onerror = () => console.warn('Image failed to load during verification test');
          testImg.src = imageUrl.startsWith('/') 
            ? `${window.location.origin}${imageUrl}` 
            : imageUrl;
        } catch (imgTestError) {
          console.warn('Image test failed:', imgTestError);
        }
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
    const updatedCategories = [...categoriesData.categories]
    updatedCategories[index] = {
      ...updatedCategories[index],
      [field]: value
    }
    
    const updatedCategoriesData = { ...categoriesData, categories: updatedCategories }
    setCategoriesData(updatedCategoriesData)
    setSectionFormData(prev => ({
      ...prev,
      content: JSON.stringify(updatedCategoriesData)
    }))
  }
  
  // Add new category
  const handleAddCategory = () => {
    const newCategory = {
      name: "New Category",
      description: "Description",
      image: "/placeholder.svg?height=200&width=200"
    }
    
    const updatedCategories = [...categoriesData.categories, newCategory]
    const updatedCategoriesData = { ...categoriesData, categories: updatedCategories }
    setCategoriesData(updatedCategoriesData)
    setSectionFormData(prev => ({
      ...prev,
      content: JSON.stringify(updatedCategoriesData)
    }))
  }
  
  // Remove category
  const handleRemoveCategory = (index) => {
    const updatedCategories = [...categoriesData.categories]
    updatedCategories.splice(index, 1)
    
    const updatedCategoriesData = { ...categoriesData, categories: updatedCategories }
    setCategoriesData(updatedCategoriesData)
    setSectionFormData(prev => ({
      ...prev,
      content: JSON.stringify(updatedCategoriesData)
    }))
  }
  
  // Update handleCategoryImageUpload to use FormData for real upload
  const handleCategoryImageUpload = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // Indicate upload in progress
      handleCategoryChange(index, 'image', 'Uploading...');
      
      // Upload the file to the server
      const uploadResponse = await homepageSectionService.uploadSectionImage(file, 'categories');
      
      if (uploadResponse && uploadResponse.fileUrl) {
        console.log(`Category image uploaded successfully to ${uploadResponse.fileUrl}`);
        
        // Store the server-provided URL
        handleCategoryChange(index, 'image', uploadResponse.fileUrl);
      } else {
        console.error('File upload failed - no URL returned');
        alert('File upload failed. Please try again.');
        // Reset the image field
        handleCategoryChange(index, 'image', '');
      }
    } catch (error) {
      console.error('Error uploading category image:', error);
      alert('Error uploading image: ' + (error.message || 'Unknown error'));
      
      // Reset the image field
      handleCategoryChange(index, 'image', '');
      
      // DON'T use blob URLs - they don't persist and will be lost on reload
      // const imageUrl = URL.createObjectURL(file);
      // handleCategoryChange(index, 'image', imageUrl);
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
  const handleProductSelection = (productId) => {
    // Toggle product selection and update productsData in one go
    setSelectedProducts(prevSelected => {
      const newSelectedProducts = prevSelected.includes(productId)
        ? prevSelected.filter(id => id !== productId)
        : [...prevSelected, productId];
      
      // Update productsData with the new selection
      const updatedProductsData = { ...productsData, productIds: newSelectedProducts };
      setProductsData(updatedProductsData);
      
      // Also update sectionFormData content to keep everything in sync
    setSectionFormData(prev => ({
      ...prev,
      content: JSON.stringify(updatedProductsData)
      }));
      
      return newSelectedProducts;
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
        processedContent = productsData;
        // Add debugging logs
        console.log('Submitting products data:', {
          selectedProducts,
          productsDataState: productsData,
          processedContent
        });
        
        // Ensure the productIds array is included and populated correctly
        if (!processedContent.productIds || !Array.isArray(processedContent.productIds)) {
          processedContent.productIds = selectedProducts;
          console.log('Fixed missing productIds in processed content:', processedContent);
        }
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
      
      // Skip ID check for new sections since they won't have an ID yet
      let sectionId = null;
      
      // Only perform ID checking for updates, not for new sections
      if (sectionFormData.id) {
        // This is an update operation - we need the section ID
        sectionId = sectionFormData.id;
        console.log(`Updating existing section with ID: ${sectionId}`);
      } else {
        // This is a create operation - no ID needed
        console.log('Creating new section - no ID needed');
      }
      
      let response;

      if (sectionFormData.id) {
        // Update existing section
        try {
          console.log(`Sending update request for section ID: ${sectionId}`, sectionData);
          response = await homepageSectionService.updateSection(sectionId, sectionData);
          console.log('Section updated:', {
            id: response._id,
            type: response.type,
            content: JSON.stringify(response.content, null, 2)
          });
          
          // Update local state with the response from the server
          // Match by either id or _id
          const updatedSections = homePageSections.map(section => 
            (section.id === sectionFormData.id || section._id === sectionFormData.id) ? response : section
          );
          
          setHomePageSections(updatedSections);
          
          // Also update localStorage
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
          // For new sections, don't need sectionId
          console.log('Sending create request for new section:', sectionData);
          response = await homepageSectionService.createSection(sectionData);
          console.log('Section created:', {
            id: response._id,
            type: response.type,
            content: JSON.stringify(response.content, null, 2)
          });
          
          // Update local state with the response from the server
          const updatedSections = [...homePageSections, response];
          setHomePageSections(updatedSections);
          
          // Also update localStorage
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
      setSectionFormData({
        id: null,
        title: "",
        type: "banner",
        content: "",
        order: homePageSections.length + 1,
        active: true,
      });
      
      // Reset section specific data
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
      
      // Upload the image first
      const response = await homepageSectionService.uploadSectionImage(file, 'icon-categories');
      
      if (response && response.fileUrl) {
        // Log successful upload
        console.log(`Icon category image uploaded successfully to ${response.fileUrl}`);
        
        // Update the iconCategoriesData with the new image URL
        const updatedCategories = [...iconCategoriesData.categories];
        updatedCategories[index] = {
          ...updatedCategories[index],
          imageUrl: response.fileUrl
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
        throw new Error('No file URL received from server');
      }
    } catch (error) {
      console.error('Error uploading icon category image:', error);
      alert(`Failed to upload image: ${error.message || 'Unknown error'}`);
      
      // Revert to empty or previous state
      const revertedCategories = [...iconCategoriesData.categories];
      revertedCategories[index] = {
        ...revertedCategories[index],
        imageUrl: revertedCategories[index].imageUrl === 'Uploading...' ? '' : revertedCategories[index].imageUrl
      };
      
      setIconCategoriesData({
        categories: revertedCategories
      });
    }
  };
  
  // Add new icon category
  const handleAddIconCategory = () => {
    const newCategory = {
      name: '',
      imageUrl: '',
      link: ''
    };
    
    // Update the iconCategoriesData state
    setIconCategoriesData(prevData => ({
      categories: [...prevData.categories, newCategory]
    }));
    
    // Update the section form data with the new content
    setSectionFormData(prev => ({
      ...prev,
      content: JSON.stringify({
        categories: [...iconCategoriesData.categories, newCategory]
      })
    }));
  };
  
  // Remove icon category
  const handleRemoveIconCategory = (index) => {
    const updatedCategories = [...iconCategoriesData.categories]
    updatedCategories.splice(index, 1)
    
    const updatedCategoriesData = { ...iconCategoriesData, categories: updatedCategories }
    setIconCategoriesData(updatedCategoriesData)
    setSectionFormData(prev => ({
      ...prev,
      content: JSON.stringify(updatedCategoriesData)
    }))
  }

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
    <div className="admin-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {user?.username || "Admin"}</p>
        </div>

        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === "homepage" ? "active" : ""}`}
            onClick={() => handleTabChange("homepage")}
          >
            Homepage Editor
          </button>
          <button
            className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
            onClick={() => handleTabChange("users")}
          >
            Users
          </button>
          <button
            className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
            onClick={() => handleTabChange("products")}
          >
            Products
          </button>
        </div>

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
                      fetchAdminData();
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

          {activeTab === "users" && (
            <div className="users-tab">
              <h2>User Management</h2>

              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>{user.role}</span>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="edit-btn">Edit</button>
                            <button className="delete-btn">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.id}</td>
                        <td>{product.title}</td>
                        <td>Rs. {(product.price).toFixed(2)}</td>
                        <td>{product.seller}</td>
                        <td>{product.category}</td>
                        <td>{formatDate(product.createdAt)}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="edit-btn">Edit</button>
                            <button className="delete-btn">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showSectionForm && (
        <div className="section-form-modal">
          <div className="section-form-content">
            <button className="close-form-btn" onClick={() => setShowSectionForm(false)}>
              ×
            </button>

            <h2>{sectionFormData.id ? "Edit Section" : "Add New Section"}</h2>

            <form onSubmit={handleSectionFormSubmit}>
              <div className="form-group">
                <label>Section Title*</label>
                <input
                  type="text"
                  name="title"
                  value={sectionFormData.title}
                  onChange={handleSectionFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Section Type*</label>
                <select name="type" value={sectionFormData.type} onChange={handleSectionFormChange} required>
                  <option value="banner">Banner</option>
                  <option value="categories">Categories</option>
                  <option value="products">Products</option>
                  <option value="icon-categories">Icon Categories</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  name="order"
                  value={sectionFormData.order}
                  onChange={handleSectionFormChange}
                  min="1"
                />
              </div>
              
              {/* Dynamic form fields based on section type */}
              {sectionFormData.type === "banner" && (
                <div className="section-type-form banner-form">
                  <h3>Banner Settings</h3>
                  
                  {bannerData.slides.map((slide, slideIndex) => (
                    <div key={slideIndex} className="banner-slide">
                      <h4>Slide {slideIndex + 1}</h4>
                      
                      <div className="form-group">
                        <label>Banner Image</label>
                        {slide.imageUrl && slide.imageUrl !== 'Uploading...' ? (
                          <div className="image-preview">
                            <img 
                              src={slide.imageUrl} 
                              alt="Banner Preview" 
                              onError={(e) => {
                                // Only apply error handling once to prevent loops
                                if (e.target.dataset.errorHandled !== 'true') {
                                  console.error('Error loading image:', slide.imageUrl);
                                  e.target.src = '/placeholder-image.png';
                                  e.target.dataset.errorHandled = 'true';
                                  
                                  // Add error message below image
                                  const errorDiv = document.createElement('div');
                                  errorDiv.className = 'image-load-error';
                                  errorDiv.textContent = 'Image failed to load. Using placeholder.';
                                  e.target.parentNode.appendChild(errorDiv);
                                }
                              }} 
                            />
                    </div>
                        ) : slide.imageUrl === 'Uploading...' ? (
                          <div className="image-preview uploading">
                            <div className="upload-spinner"></div>
                            <p>Uploading image...</p>
                          </div>
                        ) : null}
                    <div className="image-upload-controls">
                      <input
                        type="text"
                            value={slide.imageUrl || ''}
                            onChange={(e) => handleBannerImageUrlChange(slideIndex, e.target.value)}
                            placeholder="Paste Image URL here"
                            className="image-url-input"
                      />
                          <div className="upload-or-text">OR</div>
                          <div className="file-upload-wrapper">
                            <label htmlFor={`banner-image-${slideIndex}`} className="file-upload-label">
                              Choose File
                            </label>
                        <input
                              id={`banner-image-${slideIndex}`}
                          type="file"
                              accept="image/*"
                            onChange={(e) => handleBannerImageUpload(slideIndex, e)}
                            className="file-input"
                          />
                            <span className="file-upload-help">Supported formats: JPG, PNG, GIF, WebP (max 5MB)</span>
                          </div>
                    </div>
                  </div>
                  
                  <div className="form-group">
                        <label>Title</label>
                    <input
                      type="text"
                          value={slide.title}
                          onChange={(e) => handleBannerChange(slideIndex, 'title', e.target.value)}
                          placeholder="Banner title"
                    />
                  </div>
                  
                  <div className="form-group">
                        <label>Subtitle</label>
                    <input
                      type="text"
                          value={slide.subtitle}
                          onChange={(e) => handleBannerChange(slideIndex, 'subtitle', e.target.value)}
                          placeholder="Banner subtitle"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Button Text</label>
                    <input
                      type="text"
                          value={slide.buttonText}
                          onChange={(e) => handleBannerChange(slideIndex, 'buttonText', e.target.value)}
                          placeholder="Call to action button text"
                    />
                  </div>
                  
                  <div className="form-group">
                        <label>Button Link</label>
                    <input
                      type="text"
                          value={slide.buttonLink}
                          onChange={(e) => handleBannerChange(slideIndex, 'buttonLink', e.target.value)}
                          placeholder="https://example.com or /products"
                    />
                  </div>
                      
                      {bannerData.slides.length > 1 && (
                        <button 
                          type="button" 
                          className="remove-item-btn"
                          onClick={() => handleRemoveBannerSlide(slideIndex)}
                        >
                          Remove Slide
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button 
                    type="button" 
                    className="add-item-btn"
                    onClick={handleAddBannerSlide}
                  >
                    Add Slide
                  </button>
                </div>
              )}
              
              {sectionFormData.type === "categories" && (
                <div className="categories-form">
                  <h3>Categories Content</h3>
                  
                  <div className="categories-list">
                    {categoriesData.categories.map((category, index) => (
                      <div key={index} className="category-form-item">
                        <h4>Category {index + 1}</h4>
                        
                        <div className="form-group image-upload-group">
                          <label>Category Image*</label>
                          <div className="image-preview-container">
                            {category.image && (
                              <img src={category.image} alt="Category preview" className="image-preview-small" />
                            )}
                          </div>
                          <div className="image-upload-controls">
                            <input
                              type="text"
                              value={category.image}
                              onChange={(e) => handleCategoryChange(index, 'image', e.target.value)}
                              placeholder="Image URL"
                            />
                            <div className="upload-btn-wrapper">
                              <button 
                                type="button" 
                                className="upload-btn"
                                onClick={() => categoryFileInputRefs.current[index]?.click()}
                              >
                                Upload Image
                              </button>
                              <input
                                type="file"
                                ref={el => categoryFileInputRefs.current[index] = el}
                                onChange={(e) => handleCategoryImageUpload(index, e)}
                                accept="image/*"
                                style={{ display: 'none' }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="form-group">
                          <label>Category Name*</label>
                          <input
                            type="text"
                            value={category.name}
                            onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Category Description</label>
                          <input
                            type="text"
                            value={category.description}
                            onChange={(e) => handleCategoryChange(index, 'description', e.target.value)}
                          />
                        </div>
                        
                        <button 
                          type="button" 
                          className="remove-btn"
                          onClick={() => handleRemoveCategory(index)}
                        >
                          Remove Category
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      className="add-btn"
                      onClick={handleAddCategory}
                    >
                      Add Category
                    </button>
                  </div>
                </div>
              )}
              
              {sectionFormData.type === "products" && (
                <div className="section-type-form products-form">
                  <h3>Featured Products</h3>
                  
                  <div className="form-group">
                    <label>Search Products</label>
                    <input
                      type="text"
                      value={productSearch}
                      onChange={handleProductSearch}
                      placeholder="Search for products..."
                    />
                    {isSearching && <div className="searching-indicator">Searching...</div>}
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="search-results">
                      <h4>Search Results</h4>
                      <div className="product-search-list">
                        {searchResults.map(product => (
                          <div 
                            key={product.id} 
                            className={`product-search-item ${selectedProducts.includes(product.id) ? 'selected' : ''}`}
                            onClick={() => handleProductSelection(product.id)}
                          >
                            <div className="product-search-image">
                              <img 
                                src={product.image} 
                                alt={product.name} 
                                onError={(e) => {
                                  e.target.onerror = null; 
                                  e.target.src = '/placeholder-image.png';
                                }}
                              />
                            </div>
                            <div className="product-search-info">
                              <div className="product-search-name">{product.name}</div>
                              <div className="product-search-price">Rs. {product.price.toLocaleString()}</div>
                              {product.soldCount > 0 && (
                                <div className="product-search-sold">
                                  <span className="sold-badge">{product.soldCount} sold</span>
                                </div>
                              )}
                            </div>
                            <div className="product-search-checkbox">
                              <input 
                                type="checkbox" 
                                checked={selectedProducts.includes(product.id)}
                                onChange={() => {}}
                              />
                            </div>
                          </div>
                        ))}
                  </div>
                    </div>
                  )}
                  
                  {selectedProducts.length > 0 && (
                  <div className="selected-products">
                      <h4>Selected Products ({selectedProducts.length})</h4>
                      <div className="product-search-list">
                        {selectedProducts.map(productId => {
                          // Find the product details from searchResults if available
                          const productDetails = searchResults.find(p => p.id === productId);
                          
                          return (
                          <div 
                            key={productId} 
                            className="product-search-item selected"
                            onClick={() => handleProductSelection(productId)}
                          >
                            <div className="product-search-image">
                                {productDetails ? (
                                  <img 
                                    src={productDetails.image} 
                                    alt={productDetails.name} 
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = '/placeholder-image.png';
                                    }}
                                  />
                                ) : (
                                  <img src={`/placeholder-image.png`} alt={`Product ${productId}`} />
                                )}
                  </div>
                            <div className="product-search-info">
                                {productDetails ? (
                                  <>
                                    <div className="product-search-name">{productDetails.name}</div>
                                    <div className="product-search-price">Rs. {productDetails.price.toLocaleString()}</div>
                                  </>
                                ) : (
                              <div className="product-search-name">Product ID: {productId}</div>
                                )}
                                <div className="product-status-tag">Selected</div>
                            </div>
                            <div className="product-search-checkbox">
                              <input 
                                type="checkbox" 
                                checked={true}
                                onChange={() => {}}
                              />
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {sectionFormData.type === "icon-categories" && (
                <div className="section-type-form icon-categories-form">
                  <h3>Category Icons</h3>
                  
                    {iconCategoriesData.categories.map((category, index) => (
                    <div key={index} className="icon-category-item">
                        <div className="form-group">
                        <label>Category Name</label>
                          <input
                            type="text"
                          value={category.name || ''}
                            onChange={(e) => handleIconCategoryChange(index, 'name', e.target.value)}
                          placeholder="Category name"
                          />
                        </div>
                        
                        <div className="form-group image-upload-group">
                          <label>Category Image*</label>
                          <div className="image-preview-container">
                            {category.imageUrl && (
                              <img src={category.imageUrl} alt={category.name} className="image-preview-small" />
                            )}
                          </div>
                          <div className="image-upload-controls">
                            <input
                              type="text"
                              value={category.imageUrl || ''}
                              onChange={(e) => handleIconCategoryChange(index, 'imageUrl', e.target.value)}
                              placeholder="Image URL"
                            />
                            <div className="upload-btn-wrapper">
                              <button 
                                type="button" 
                                className="upload-btn"
                                onClick={() => document.getElementById(`icon-category-image-${index}`).click()}
                              >
                                Upload Image
                              </button>
                              <input
                                type="file"
                                id={`icon-category-image-${index}`}
                                onChange={(e) => handleIconCategoryImageUpload(e, index)}
                                accept="image/*"
                                style={{ display: 'none' }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="form-group">
                        <label>Link</label>
                          <input
                            type="text"
                          value={category.link || ''}
                            onChange={(e) => handleIconCategoryChange(index, 'link', e.target.value)}
                          placeholder="Category link (e.g., /category/shoes)"
                          />
                        </div>
                        
                        <button 
                          type="button" 
                        className="remove-item-btn"
                          onClick={() => handleRemoveIconCategory(index)}
                        >
                        Remove
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                    className="add-item-btn"
                      onClick={handleAddIconCategory}
                    >
                    Add Category
                    </button>
                </div>
              )}
              
              {sectionFormData.type === "custom" && (
                <div className="form-group">
                  <label>Content (JSON)</label>
                  <textarea
                    name="content"
                    value={sectionFormData.content}
                    onChange={handleSectionFormChange}
                    rows="6"
                    placeholder={`Enter custom JSON content`}
                  ></textarea>
                  <p className="help-text">Enter content in JSON format for custom section</p>
                </div>
              )}

              <div className="form-group checkbox-group">
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

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowSectionForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {sectionFormData.id ? "Update Section" : "Add Section"}
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
