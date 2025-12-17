export interface Product {
  id: number
  name: string
  description: string
  price: number
  category: string
  rating: number
}

export const products: Product[] = [
  {
    id: 1,
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
    price: 199.99,
    category: 'Electronics',
    rating: 4.8,
  },
  {
    id: 2,
    name: 'Smart Watch Pro',
    description: 'Feature-rich smartwatch with health tracking, GPS, and water resistance.',
    price: 299.99,
    category: 'Electronics',
    rating: 4.6,
  },
  {
    id: 3,
    name: 'Organic Coffee Beans',
    description: 'Premium organic coffee beans sourced from sustainable farms. 1kg pack.',
    price: 24.99,
    category: 'Food & Beverage',
    rating: 4.9,
  },
  {
    id: 4,
    name: 'Yoga Mat Premium',
    description: 'Eco-friendly yoga mat with superior grip and cushioning. Perfect for all yoga styles.',
    price: 49.99,
    category: 'Fitness',
    rating: 4.7,
  },
  {
    id: 5,
    name: 'Leather Backpack',
    description: 'Handcrafted genuine leather backpack with laptop compartment and multiple pockets.',
    price: 149.99,
    category: 'Fashion',
    rating: 4.5,
  },
  {
    id: 6,
    name: 'Skincare Set',
    description: 'Complete skincare routine set with cleanser, toner, serum, and moisturizer.',
    price: 79.99,
    category: 'Beauty',
    rating: 4.8,
  },
]



