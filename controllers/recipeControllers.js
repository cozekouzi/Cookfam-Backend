import asyncHandler from "express-async-handler";
import Recipe from "../models/recipeModel.js";
import User from "../models/userModel.js";
import cloudinary from "cloudinary";
//============

const postRecipe = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(id);
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  console.log(user);

  const { title, description, ingredients, steps, category } = req.body;
  console.log(req.body);
  if (!title || !description || !ingredients || !steps || !category) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (!req.file || req.file.length === 0) {
    return res.status(400).json({ message: "Image file is missing" });
  }

  try {
    cloudinary.v2.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.API_KEY,
      api_secret: process.env.API_SECRET,
    });

    const result = await cloudinary.v2.uploader.upload(req.file.path);

    const parsedIngredients = ingredients.split(";").map((i) => i.trim());

    const recipe = new Recipe({
      user: user.id,
      title,
      description,
      ingredients: parsedIngredients,
      steps,
      image: result.secure_url,
      category: category.split(",").map((c) => c.trim()),
    });

    await recipe.save();
    return res.status(200).json({
      recipe,
    });
  } catch (error) {
    console.error(error);
    // return res.status(500).json({ message: "Internal server error" });
  }
});

//============

const getAllRecipes = asyncHandler(async (req, res) => {
  const recipe = await Recipe.find();
  res.json(recipe);
});

//============

const getRecipeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const recipe = await Recipe.findById(id);
  console.log(id);
  res.json(recipe);
});
//============

const updateRecipeFour = asyncHandler(async (req, res) => {
  const { user, id } = req.body;
  const useri = await User.findById(user);

  if (!useri) {
    return res.status(404).json({ message: "User not found" });
  }

  const { title, description, ingredients, steps } = req.body;

  // Check if there is a new image
  let imageUrl;
  if (req.file) {
    try {
      cloudinary.v2.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET,
      });

      const result = await cloudinary.v2.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Split the ingredients string into an array
  const parsedIngredients = ingredients.split(";").map((i) => i.trim());

  // Update the recipe
  const updates = {
    title,
    description,
    ingredients: parsedIngredients,
    steps,
    ...(imageUrl && { image: imageUrl }),
  };

  const options = { new: true };
  const recipe = await Recipe.findByIdAndUpdate(id, updates, options);

  if (!recipe) {
    return res.status(404).json({ message: "Recipe not found" });
  }

  return res.json({ recipe });
});

//=============

const deleteRecipe = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const recipe = await Recipe.findByIdAndDelete(id);
  console.log(id);
  if (recipe) {
    return res.status(200).json({
      message: `${id} had been deleted successfully`,
    });
  } else return res.status(404).json({ message: `${id} not found` });
});

//=============

const approveRecipe = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const recipe = await Recipe.findById(id);
  if (!recipe) {
    return res.status(404).json({ message: "Recipe not found" });
  }

  recipe.approved = true;

  await recipe.save();

  return res.json({ recipe });
});
export default {
  getRecipeById,
  approveRecipe,
  postRecipe,
  getAllRecipes,
  updateRecipeFour,
  deleteRecipe,
};
