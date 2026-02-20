// Test if upload route can be imported
console.log('Testing upload route import...\n');

try {
    const uploadRoutes = await import('./routes/upload.js');
    console.log('✅ Upload route imported successfully');
    console.log('Default export:', uploadRoutes.default);
} catch (error) {
    console.error('❌ Failed to import upload route:');
    console.error(error);
}
