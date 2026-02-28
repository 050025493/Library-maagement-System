-- Library Management System Database Schema and Seed Data

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  publisher TEXT,
  publication_year INTEGER,
  category TEXT,
  shelf_location TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'reserved', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample seed data
INSERT INTO books (title, author, isbn, publisher, publication_year, category, shelf_location, status) VALUES
  ('The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'Scribner', 1925, 'Fiction', 'A-12-3', 'available'),
  ('To Kill a Mockingbird', 'Harper Lee', '9780061120084', 'Harper Perennial', 1960, 'Fiction', 'A-12-5', 'available'),
  ('1984', 'George Orwell', '9780451524935', 'Signet Classic', 1949, 'Fiction', 'A-13-1', 'borrowed'),
  ('Pride and Prejudice', 'Jane Austen', '9780141439518', 'Penguin Classics', 1813, 'Fiction', 'A-13-4', 'available'),
  ('The Catcher in the Rye', 'J.D. Salinger', '9780316769174', 'Little, Brown and Company', 1951, 'Fiction', 'A-14-2', 'reserved'),
  
  ('A Brief History of Time', 'Stephen Hawking', '9780553380163', 'Bantam', 1988, 'Science', 'B-05-7', 'available'),
  ('The Selfish Gene', 'Richard Dawkins', '9780199291151', 'Oxford University Press', 1976, 'Science', 'B-06-2', 'available'),
  ('Cosmos', 'Carl Sagan', '9780345539434', 'Ballantine Books', 1980, 'Science', 'B-06-8', 'available'),
  ('The Origin of Species', 'Charles Darwin', '9780451529060', 'Signet Classic', 1859, 'Science', 'B-07-1', 'maintenance'),
  
  ('Sapiens', 'Yuval Noah Harari', '9780062316097', 'Harper', 2011, 'History', 'C-03-4', 'available'),
  ('Guns, Germs, and Steel', 'Jared Diamond', '9780393317558', 'W. W. Norton & Company', 1997, 'History', 'C-04-1', 'available'),
  ('The Silk Roads', 'Peter Frankopan', '9781101946329', 'Vintage', 2015, 'History', 'C-04-5', 'borrowed'),
  
  ('Steve Jobs', 'Walter Isaacson', '9781451648539', 'Simon & Schuster', 2011, 'Biography', 'D-08-3', 'available'),
  ('The Diary of a Young Girl', 'Anne Frank', '9780553296983', 'Bantam', 1947, 'Biography', 'D-08-7', 'available'),
  ('Long Walk to Freedom', 'Nelson Mandela', '9780316548182', 'Little, Brown and Company', 1994, 'Biography', 'D-09-2', 'available'),
  
  ('Clean Code', 'Robert C. Martin', '9780132350884', 'Prentice Hall', 2008, 'Technology', 'E-15-1', 'available'),
  ('The Pragmatic Programmer', 'Andy Hunt', '9780135957059', 'Addison-Wesley', 2019, 'Technology', 'E-15-4', 'borrowed'),
  ('Design Patterns', 'Erich Gamma', '9780201633610', 'Addison-Wesley', 1994, 'Technology', 'E-16-2', 'available'),
  ('Introduction to Algorithms', 'Thomas H. Cormen', '9780262033848', 'MIT Press', 2009, 'Technology', 'E-16-7', 'available'),
  
  ('Thinking, Fast and Slow', 'Daniel Kahneman', '9780374533557', 'Farrar, Straus and Giroux', 2011, 'Psychology', 'F-10-3', 'available'),
  ('Man''s Search for Meaning', 'Viktor E. Frankl', '9780807014295', 'Beacon Press', 1946, 'Psychology', 'F-10-8', 'available'),
  
  ('The Republic', 'Plato', '9780872201361', 'Hackett Publishing', -380, 'Philosophy', 'G-11-2', 'available'),
  ('Meditations', 'Marcus Aurelius', '9780812968255', 'Modern Library', 180, 'Philosophy', 'G-11-5', 'available'),
  
  ('The Lean Startup', 'Eric Ries', '9780307887894', 'Crown Business', 2011, 'Business', 'H-20-1', 'available'),
  ('Good to Great', 'Jim Collins', '9780066620992', 'HarperBusiness', 2001, 'Business', 'H-20-4', 'borrowed');

-- Enable Row Level Security (RLS)
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY "Allow public read access" ON books
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated insert" ON books
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON books
  FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete" ON books
  FOR DELETE USING (true);

-- Grant permissions
GRANT SELECT ON books TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON books TO authenticated;
