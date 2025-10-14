import { NextResponse } from "next/server";
import { downloadGlbFile } from "../../../services/fileDownloader";
import { uploadGlbToCloudinary } from "../../../services/cloudinaryUploader";

export async function POST(req) {
  try {
    const body = await req.json();
    const { modelUrl } = body;

    if (!modelUrl) {
      return NextResponse.json({ error: "No model URL provided" }, { status: 400 });
    }

    console.log("Processing 3D model URL:", modelUrl);

    // Download the .glb file from the URL
    const glbBlob = await downloadGlbFile(modelUrl);
    
    // Generate a unique avatar ID
    const avatarId = `avatar-${Date.now()}`;
    
    // Upload to Cloudinary
    const cloudinaryUrl = await uploadGlbToCloudinary(glbBlob, avatarId);
    
    console.log("Model uploaded to Cloudinary:", cloudinaryUrl);

    return NextResponse.json({
      success: true,
      originalUrl: modelUrl,
      cloudinaryUrl: cloudinaryUrl,
      avatarId: avatarId,
      message: "3D model successfully uploaded to Cloudinary"
    });
    
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
