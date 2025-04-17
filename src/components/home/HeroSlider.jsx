"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import "./HeroSlider.css"

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides, setSlides] = useState([])

  useEffect(() => {
    // In a real app, fetch slides from API
    setSlides([
      {
        id: 1,
        image: "/placeholder.svg?height=400&width=800",
        title: "Season Sale",
        subtitle: "Special Offer",
        description: "Get the best deals on our products with competitive prices and high-quality materials.",
        buttonText: "Shop Now",
        buttonLink: "/sale",
      },
      {
        id: 2,
        image: "/placeholder.svg?height=400&width=800",
        title: "New Arrivals",
        subtitle: "Fresh Collection",
        description: "Discover our latest products and stay ahead of the trends with our new collection.",
        buttonText: "Explore",
        buttonLink: "/new",
      },
      {
        id: 3,
        image: "/placeholder.svg?height=400&width=800",
        title: "AR Experience",
        subtitle: "Try Before You Buy",
        description: "Use our AR technology to see how products look in your space before making a purchase.",
        buttonText: "Try AR",
        buttonLink: "/ar-experience",
      },
    ])
  }, [])

  useEffect(() => {
    // Auto-slide functionality
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [slides.length])

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  if (slides.length === 0) {
    return <div className="hero-slider-placeholder"></div>
  }

  return (
    <div className="hero-slider">
      <div className="slider-container">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`slide ${index === currentSlide ? "active" : ""}`}
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="slide-content">
              <div className="slide-text">
                <span className="subtitle">{slide.subtitle}</span>
                <h2 className="title">{slide.title}</h2>
                <p className="description">{slide.description}</p>
                <Link to={slide.buttonLink} className="cta-button">
                  {slide.buttonText}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="slider-control prev" onClick={prevSlide}>
        ‹
      </button>
      <button className="slider-control next" onClick={nextSlide}>
        ›
      </button>

      <div className="slider-dots">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentSlide ? "active" : ""}`}
            onClick={() => goToSlide(index)}
          ></button>
        ))}
      </div>
    </div>
  )
}

export default HeroSlider
