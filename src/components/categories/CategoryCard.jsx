import { Link } from "react-router-dom"
import { API_URL, UPLOAD_URL } from "../../config"
import "./CategoryCard.css"

const CategoryCard = ({ category }) => {
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "/placeholder.svg";
    
    // If already a fully qualified URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If it's just a filename (not a path), prepend the uploads directory
    if (!imagePath.startsWith('/')) {
      return `${UPLOAD_URL}/${imagePath}`;
    }
    
    // If it's a path starting with /uploads/, prepend the API URL
    if (imagePath.startsWith('/uploads/')) {
      return `${API_URL}${imagePath}`;
    }
    
    // Fall back to API URL + path
    return `${API_URL}${imagePath}`;
  };

  // Determine the link to use - prefer slug if available
  const categoryLink = category.slug 
    ? `/category/${category.slug}` 
    : `/category/${category._id || category.id || category.name.toLowerCase().replace(/\s+/g, '-')}`;

  // Use image from category object, falling back to older property names
  const imageUrl = category.image || category.imageUrl || "/placeholder.svg";

  return (
    <Link to={categoryLink} className="category-card">
      <img 
        src={getImageUrl(imageUrl)} 
        alt={category.name}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "/placeholder.svg";
        }}
      />
      <div className="category-card-content">
        <h3 className="category-card-title">{category.name}</h3>
        <p className="category-card-description">{category.description}</p>
      </div>
    </Link>
  )
}

export default CategoryCard
