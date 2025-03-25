import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const sampleProducts = [
  {
    name: 'Premium NPK Fertilizer',
    category: 'Fertilizers',
    price: 1200,
    quantity: 100,
    description: 'High-quality NPK fertilizer for better crop yield. Contains essential nutrients in the perfect ratio of Nitrogen, Phosphorus, and Potassium. Suitable for all types of crops.',
    imageUrl: 'https://m.media-amazon.com/images/I/71SHXwxX3bL._AC_UF1000,1000_QL80_.jpg',
    vendorName: 'AgriChem Solutions',
    rating: 4.5
  },
  {
    name: 'Organic Pesticide',
    category: 'Pesticides',
    price: 800,
    quantity: 50,
    description: 'Natural pest control solution safe for organic farming. Made from neem and other natural ingredients. Effective against a wide range of pests while being eco-friendly.',
    imageUrl: 'https://m.media-amazon.com/images/I/61MGGcVeFIL._AC_UF894,1000_QL80_.jpg',
    vendorName: 'Green Earth Products',
    rating: 4.2
  },
  {
    name: 'Mini Tractor',
    category: 'Machinery',
    price: 250000,
    quantity: 5,
    description: 'Compact tractor perfect for small to medium farms. 20HP engine, power steering, and hydraulic system. Fuel efficient and easy to maintain. Comes with basic implements.',
    imageUrl: 'https://5.imimg.com/data5/SELLER/Default/2021/3/KO/QG/XG/3922575/mini-tractor.jpg',
    vendorName: 'Farm Machinery Ltd',
    rating: 4.8
  },
  {
    name: 'Hybrid Wheat Seeds',
    category: 'Seeds',
    price: 450,
    quantity: 1000,
    description: 'High-yield wheat seeds resistant to common diseases. Developed through advanced breeding techniques. Gives 20% higher yield compared to regular varieties.',
    imageUrl: 'https://m.media-amazon.com/images/I/71dxCQxaK5L._AC_UF1000,1000_QL80_.jpg',
    vendorName: 'Superior Seeds Co',
    rating: 4.6
  },
  {
    name: 'Drip Irrigation Kit',
    category: 'Machinery',
    price: 15000,
    quantity: 20,
    description: 'Complete drip irrigation system for 1 acre. Includes pipes, drippers, filters, and connectors. Saves water and ensures uniform distribution.',
    imageUrl: 'https://5.imimg.com/data5/SELLER/Default/2021/7/VX/VK/ZH/132240952/drip-irrigation-system.jpg',
    vendorName: 'Farm Machinery Ltd',
    rating: 4.7
  }
];

export const initializeProducts = async () => {
  try {
    const productsRef = collection(db, 'products');
    
    for (const product of sampleProducts) {
      await addDoc(productsRef, {
        ...product,
        createdAt: new Date().toISOString()
      });
    }
    
    console.log('Sample products added successfully');
  } catch (error) {
    console.error('Error adding sample products:', error);
  }
};
