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
    const parts     = imageUrl.split("/");
    const filename  = parts[parts.length - 1].split(".")[0]; // abc
    const folder    = parts[parts.length - 2];               // questions
    const subfolder = parts[parts.length - 3];               // frenchkonnect
    const publicId  = `${subfolder}/${folder}/${filename}`;
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete error:", err.message);
  }
};

/* ══════════════════════════════════════════════
   PDF UPLOAD — Sample Papers ke liye
   resource_type: "raw" use hoga PDF ke liye
══════════════════════════════════════════════ */

/**
 * PDF Buffer se Cloudinary pe upload karo
 * @param {Buffer} fileBuffer - PDF ka buffer
 * @param {string} folder - cloudinary folder name
 * @returns {{ url: string, publicId: string }}
 */
export const uploadPdfToCloudinary = (fileBuffer, folder = "sample-papers") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `frenchkonnect/${folder}`,
        resource_type: "auto", // ✅ "raw" ki jagah "auto"
        format: "pdf",
        type: "upload",
        access_mode: "public",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve({
          url:      result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
};
/**
 * Cloudinary se PDF delete karo
 * @param {string} publicId - DB mein stored public_id
 */
export const deletePdfFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    // ✅ "raw" → "image" kyunki auto upload PDF ko image type mein store karta hai
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (err) {
    console.error("Cloudinary PDF delete error:", err.message);
  }
};
/**
 * PDF ka download URL banao — fl_attachment flag lagata hai
 * Isse browser PDF seedha download karega, open nahi karega
 * @param {string} pdfUrl - Cloudinary PDF URL
 * @returns {string} - Download URL
 */
export const getPdfDownloadUrl = (pdfUrl) => {
  if (!pdfUrl) return "";
  // auto upload pe URL mein "image" ya "raw" hoga
  // fl_attachment download force karta hai
  return pdfUrl
    .replace("/image/upload/", "/image/upload/fl_attachment/")
    .replace("/raw/upload/",   "/raw/upload/fl_attachment/");
};
export default cloudinary;