

export interface PhysicalCopy {
  barcode: string;
  location: string;
  status: 'Available' | 'Loaned' | 'Reference Only';
}

export interface Book {
  id: string;
  title: string;
  author: string;
  edition: string;
  publicationYear: number;
  publisher: string;
  language: string;
  audience: string;
  content: string;
  format: string;
  popularity: number; // 1-100 for sorting
  tags: string[];
  coverColor: string;
  copies: PhysicalCopy[];
}

export const MOCK_BOOKS: Book[] = [
  {
    id: "1",
    title: "JavaScript - The Definitive Guide",
    author: "David Flanagan",
    edition: "7th Edition",
    publicationYear: 2020,
    publisher: "O'Reilly Media",
    language: "English",
    audience: "Adult",
    content: "Non-fiction",
    format: "Regular print",
    popularity: 95,
    tags: ["#Dev", "#JavaScript", "#Web"],
    coverColor: "bg-[#e8dcc4]",
    copies: [
      { barcode: "VIT1001", location: "CDMM Library", status: "Available" },
      { barcode: "VIT1002", location: "CDMM Library", status: "Loaned" }
    ]
  },
  {
    id: "2",
    title: "Einführung in die Informatik", // A little German computer science!
    author: "Heinz-Peter Gumm",
    edition: "10th Edition",
    publicationYear: 2012,
    publisher: "De Gruyter",
    language: "German",
    audience: "Specialized",
    content: "Non-fiction",
    format: "E-Book",
    popularity: 70,
    tags: ["#CS", "#Basics", "#German"],
    coverColor: "bg-[#276e72]",
    copies: [
      { barcode: "EBK001", location: "Digital", status: "Available" }
    ]
  },
  {
    id: "3",
    title: "Clean Code",
    author: "Robert C. Martin",
    edition: "1st Edition",
    publicationYear: 2008,
    publisher: "Prentice Hall",
    language: "English",
    audience: "Adult",
    content: "Non-fiction",
    format: "Regular print",
    popularity: 99,
    tags: ["#Dev", "#BestPractices"],
    coverColor: "bg-[#f1f5f9]",
    copies: [
      { barcode: "VIT2001", location: "Main Library", status: "Loaned" }
    ]
  }
];