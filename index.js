// --- Core modules ---
import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";
import multer from "multer"; // You forgot to import multer

// --- Setup ---
const app = express(); // ✅ Declare app BEFORE using it
const __dirname = dirname(fileURLToPath(import.meta.url));
const port = 3000;

// --- Middleware ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// --- Home Route (Show Latest 4 Blogs) ---
app.get("/", (req, res) => {
  const filePath = path.join(__dirname, "data.json");
  let blogs = [];

if(fs.existsSync(filePath)){
  const data = fs.readFileSync(filePath);
  blogs = JSON.parse(data);
}

blogs.sort((a, b) => new Date(b.date) - new Date(a.date));

const latestBlogs = blogs.slice(0, 4);
res.render("index.ejs", { latestBlogs });
});

// --- Blog Submission Route ---
app.post("/submit", upload.single("featureImage"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No image uploaded. Please select a file.");
  }

  const { title, Fname, Lname, publicationDate, content } = req.body;

  const newBlog = {
    id: Date.now().toString(),
    title,
    fname: Fname,
    lname: Lname,
    date: publicationDate,
    image: `/uploads/${req.file.filename}`,
    content,
  };

  const filePath = path.join(__dirname, "data.json");
  let blogs = [];

  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    blogs = JSON.parse(data);
  }

  blogs.unshift(newBlog); // Add new blog at the top
  fs.writeFileSync(filePath, JSON.stringify(blogs, null, 2)); // Save updated blogs

  res.redirect("/");
});



// --- Other Pages ---
app.get("/submit-blog", (req, res) => res.render("submit"));
app.get("/about", (req, res) => res.render("about"));
app.get("/contact", (req, res) => res.render("contact"));
app.get("/terms&condition", (req, res) => res.render("terms&condition"));

// --- Blogs Page ---
app.get("/blogs", (req, res) => {
  const filePath = path.join(__dirname, "data.json");
  let blogs = [];

if(fs.existsSync(filePath)){
  const data = fs.readFileSync(filePath);
  blogs = JSON.parse(data);
}

blogs.sort((a, b) => new Date(b.date) - new Date(a.date));

res.render("blogs.ejs", { blogs });
});

// --- BLOG CONTENT ---
app.get("/blog/:id", (req, res) => {
  const blogId = req.params.id;
  const filePath = path.join(__dirname, "data.json");
  const data = JSON.parse(fs.readFileSync(filePath));

  const blog = data.find(b => b.id == blogId);

  if (!blog) {
    return res.status(404).send("Blog not found");
  }

  const otherBlogs = data.filter(b => b.id != blogId);
  const shuffled = otherBlogs.sort(() => 0.5 - Math.random());
  const randomFour = shuffled.slice(0, 4);

  res.render("blog-content", { blog, otherBlogs: randomFour });
});

//EDIT ROUTE
app.get("/blog/edit/:id", (req, res) => {
  const blogId = req.params.id;
  const filePath = path.join(__dirname, "data.json");
  const blogs = JSON.parse(fs.readFileSync(filePath));
  const blog = blogs.find(b => b.id == blogId);

  if (!blog) {
    return res.status(404).send("Blog not found");
  }
  res.render("edit-blog.ejs", { blog });
});

app.post("/blog/edit/:id", upload.single("featureImage"), (req, res) => {
  const blogId = req.params.id; //extratcts id
  console.log(blogId);
  const filePath = path.join(__dirname, "data.json"); //stores data.json filepath
  let blogs = JSON.parse(fs.readFileSync(filePath));

  const blogIndex = blogs.findIndex(blog => blog.id === blogId);
  console.log(blogIndex);

  if (blogIndex === -1) {
    console.log("Blog not found with ID:", blogId);
    return res.status(404).send("Blog not found");
  }

  const imagePath = req.file
  ? `/uploads/${req.file.filename}`  // New uploaded image path
  : req.body.existingImage;         // Keep old one if no new image uploaded
  
  // Update blog info
  blogs[blogIndex].title = req.body.editTitle;
  blogs[blogIndex].fname = req.body.editFname;
  blogs[blogIndex].lname = req.body.editLname;
  blogs[blogIndex].date = req.body.editPublicationDate; // you can update the date if you want
  blogs[blogIndex].content = req.body.editContent;

  // Save updated data
  fs.writeFileSync(filePath, JSON.stringify(blogs, null, 2));

  res.redirect("/blogs");
});


//delete route
app.post("/blog/delete/:id", (req, res) =>{
  const blogId = req.params.id;
  const filePath = path.join(__dirname, "data.json");
  const blogs = JSON.parse(fs.readFileSync(filePath));

  const blogIndex = blogs.findIndex(blog => blog.id === blogId);
  console.log(blogIndex);

  if(blogIndex === -1){
    console.log("Blog not found with ID: ", blogId);
    return res.status(404).send("Blog not found");
  }

  const imagePath = path.join(__dirname, "public", blogs[blogIndex].image || "");
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }


  blogs.splice(blogIndex, 1);

  fs.writeFileSync(filePath, JSON.stringify(blogs, null, 2));
  
  res.redirect("/blogs");
  

});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
