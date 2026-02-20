import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🔍 Verifying Image Upload System...\n');

let allGood = true;

// Check 1: Multer in package.json
console.log('1️⃣ Checking package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (packageJson.dependencies.multer) {
    console.log('   ✅ Multer listed in dependencies:', packageJson.dependencies.multer);
} else {
    console.log('   ❌ Multer NOT in dependencies');
    allGood = false;
}

// Check 2: Multer installed
console.log('\n2️⃣ Checking node_modules...');
if (fs.existsSync('node_modules/multer')) {
    console.log('   ✅ Multer installed in node_modules');
} else {
    console.log('   ❌ Multer NOT installed - run: npm install');
    allGood = false;
}

// Check 3: Upload route exists
console.log('\n3️⃣ Checking routes/upload.js...');
if (fs.existsSync('routes/upload.js')) {
    console.log('   ✅ Upload route file exists');
    const uploadContent = fs.readFileSync('routes/upload.js', 'utf8');
    if (uploadContent.includes('multer')) {
        console.log('   ✅ Upload route imports multer');
    } else {
        console.log('   ❌ Upload route does not import multer');
        allGood = false;
    }
} else {
    console.log('   ❌ Upload route file NOT found');
    allGood = false;
}

// Check 4: Server.js registers upload route
console.log('\n4️⃣ Checking server.js...');
if (fs.existsSync('server.js')) {
    const serverContent = fs.readFileSync('server.js', 'utf8');
    if (serverContent.includes('uploadRoutes')) {
        console.log('   ✅ Server imports upload routes');
    } else {
        console.log('   ❌ Server does NOT import upload routes');
        allGood = false;
    }
    if (serverContent.includes('/api/upload')) {
        console.log('   ✅ Server registers /api/upload endpoint');
    } else {
        console.log('   ❌ Server does NOT register /api/upload endpoint');
        allGood = false;
    }
} else {
    console.log('   ❌ server.js NOT found');
    allGood = false;
}

// Check 5: Folder structure
console.log('\n5️⃣ Checking folder structure...');
const folders = [
    'public/images',
    'public/images/products',
    'public/images/products/temp'
];

folders.forEach(folder => {
    if (fs.existsSync(folder)) {
        console.log(`   ✅ ${folder} exists`);
    } else {
        console.log(`   ❌ ${folder} NOT found - creating...`);
        fs.mkdirSync(folder, { recursive: true });
        console.log(`   ✅ Created ${folder}`);
    }
});

// Check 6: Admin products HTML has file input
console.log('\n6️⃣ Checking admin products HTML...');
if (fs.existsSync('public/admin/products.html')) {
    const htmlContent = fs.readFileSync('public/admin/products.html', 'utf8');
    if (htmlContent.includes('type="file"')) {
        console.log('   ✅ File input exists in products.html');
    } else {
        console.log('   ❌ File input NOT found in products.html');
        allGood = false;
    }
    if (htmlContent.includes('uploadProductImages')) {
        console.log('   ✅ Upload function referenced');
    } else {
        console.log('   ❌ Upload function NOT referenced');
        allGood = false;
    }
} else {
    console.log('   ❌ products.html NOT found');
    allGood = false;
}

// Check 7: Admin products JS has upload function
console.log('\n7️⃣ Checking admin products JS...');
if (fs.existsSync('public/js/admin/products.js')) {
    const jsContent = fs.readFileSync('public/js/admin/products.js', 'utf8');
    if (jsContent.includes('uploadProductImages')) {
        console.log('   ✅ uploadProductImages function exists');
    } else {
        console.log('   ❌ uploadProductImages function NOT found');
        allGood = false;
    }
    if (jsContent.includes('FormData')) {
        console.log('   ✅ Uses FormData for upload');
    } else {
        console.log('   ❌ Does NOT use FormData');
        allGood = false;
    }
} else {
    console.log('   ❌ products.js NOT found');
    allGood = false;
}

// Check 8: Test upload page exists
console.log('\n8️⃣ Checking test upload page...');
if (fs.existsSync('public/test-upload.html')) {
    console.log('   ✅ Test upload page exists');
    console.log('   📝 Access at: http://localhost:3000/test-upload.html');
} else {
    console.log('   ⚠️  Test upload page NOT found (optional)');
}

// Summary
console.log('\n' + '='.repeat(60));
if (allGood) {
    console.log('✅ ALL CHECKS PASSED!');
    console.log('\nSystem is ready. Next steps:');
    console.log('1. Start server: npm run dev');
    console.log('2. Login as admin: http://localhost:3000/login.html');
    console.log('3. Test upload: http://localhost:3000/test-upload.html');
    console.log('4. Or go to: http://localhost:3000/admin/products.html');
} else {
    console.log('❌ SOME CHECKS FAILED');
    console.log('\nPlease fix the issues above before testing.');
    console.log('Run: npm install (if multer not installed)');
}
console.log('='.repeat(60) + '\n');
