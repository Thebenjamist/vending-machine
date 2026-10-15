export type Product = {
  id: string;
  name: string;
  pricePence: number;
  accent: string;
  imageSrc: string;
  slot: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "crisps",
    name: "Sea Salt Crisps",
    pricePence: 65,
    accent: "#C4A35A",
    imageSrc: "/product-images/crisps.webp",
    slot: "A1",
  },
  {
    id: "cola",
    name: "Cola Can",
    pricePence: 100,
    accent: "#C45C48",
    imageSrc: "/product-images/cola.webp",
    slot: "A2",
  },
  {
    id: "water",
    name: "Still Water",
    pricePence: 120,
    accent: "#5B8FA8",
    imageSrc: "/product-images/water.webp",
    slot: "A3",
  },
  {
    id: "bar",
    name: "Cocoa Bar",
    pricePence: 150,
    accent: "#6B4F3A",
    imageSrc: "/product-images/chocolate.webp",
    slot: "B1",
  },
  {
    id: "nuts",
    name: "Roasted Nuts",
    pricePence: 180,
    accent: "#A67C52",
    imageSrc: "/product-images/nuts.webp",
    slot: "B2",
  },
  {
    id: "juice",
    name: "Orange Juice",
    pricePence: 200,
    accent: "#D4893A",
    imageSrc: "/product-images/orange-juice.webp",
    slot: "B3",
  },
];
