import { Link } from "react-router-dom"
import "./CategoryCard.css"

const CategoryCard = ({ category }) => {
  return (
    <Link to={`/category/${category.name.toLowerCase()}`} className="category-card">
      <img src={category.image || "/placeholder.svg"} alt={category.name} />
      <div className="category-card-content">
        <h3 className="category-card-title">{category.name}</h3>
        <p className="category-card-description">{category.description}</p>
      </div>
    </Link>
  )
}

export default CategoryCard
