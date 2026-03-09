import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Buffer ya file path se Cloudinary pe upload karo
 * @param {Buffer} fileBuffer - file ka buffer
 * @param {string} folder - cloudinary folder name
 * @returns {string} - Cloudinary URL
 */
export const uploadToCloudinary = (fileBuffer, folder = "questions") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `frenchkonnect/${folder}`,
        resource_type: "image",
        transformation: [
          { quality: "auto", fetch_format: "auto" }, // auto optimize
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url); // https://res.cloudinary.com/...
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Cloudinary se image delete karo
 * @param {string} imageUrl - Cloudinary URL
 */
export const deleteFromCloudinary = async (imageUrl) => {
  if (!imageUrl || !imageUrl.includes("cloudinary.com")) return;
  try {
    // URL se public_id nikalo
    // e.g. https://res.cloudinary.com/dc08uzrbz/image/upload/v123/frenchkonnect/questions/abc.jpg
    // public_id = frenchkonnect/questions/abc
    const parts    = imageUrl.split("/");
    const filename = parts[parts.length - 1].split(".")[0]; // abc
    const folder   = parts[parts.length - 2];               // questions
    const subfolder = parts[parts.length - 3];              // frenchkonnect
    const publicId = `${subfolder}/${folder}/${filename}`;
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete error:", err.message);
  }
};

export default cloudinary;