import { v2 as cloudinary } from 'cloudinary';

// 1. Configure Cloudinary — inline credentials for onboarding test
cloudinary.config({
  cloud_name: 'dqom9wqz',
  api_key: '715546319883844',
  api_secret: '1L5xyNSSOPzweb45yjtWxV634oQ',
});

async function main() {
  try {
    // 2. Upload an image from Cloudinary's demo domain
    console.log('Uploading image...');
    const uploadResult = await cloudinary.uploader.upload(
      'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg',
      { public_id: 'freestyle-test-upload' }
    );
    console.log('\n✅ Upload successful!');
    console.log('Secure URL:', uploadResult.secure_url);
    console.log('Public ID:', uploadResult.public_id);

    // 3. Get image details (metadata)
    console.log('\n📋 Image details:');
    console.log('Width:', uploadResult.width, 'px');
    console.log('Height:', uploadResult.height, 'px');
    console.log('Format:', uploadResult.format);
    console.log('File size:', uploadResult.bytes, 'bytes');

    // 4. Transform the image
    // f_auto — automatically selects the best format (WebP, AVIF, etc.) based on the viewer's browser
    // q_auto — automatically adjusts quality for optimal file size without visible loss
    const transformedUrl = cloudinary.url('freestyle-test-upload', {
      fetch_format: 'auto', // f_auto
      quality: 'auto',      // q_auto
    });

    console.log('\n🎉 Done! Click the link below to see the optimized version of the image.');
    console.log('Check the size and the format.');
    console.log('\nTransformed URL:', transformedUrl);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
