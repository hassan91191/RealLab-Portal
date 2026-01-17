const { google } = require('googleapis');

exports.handler = async (event) => {
    // التأكد من وجود ID المريض
    const patientId = event.queryStringParameters.id;
    if (!patientId) {
        return { statusCode: 400, body: JSON.stringify({ error: "Patient ID missing" }) };
    }

    try {
        // إعداد المصادقة باستخدام مفتاح الخدمة من البيئة
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        const drive = google.drive({ version: 'v3', auth });

        // 1. البحث عن فولدر المريض بالاسم
        // بنبحث عن فولدر اسمه هو نفس رقم المريض
        const folderRes = await drive.files.list({
            q: `mimeType='application/vnd.google-apps.folder' and name='${patientId}' and trashed=false`,
            fields: 'files(id, name)',
        });

        if (folderRes.data.files.length === 0) {
            return { statusCode: 404, body: JSON.stringify({ error: "Folder not found" }) };
        }

        const folderId = folderRes.data.files[0].id;

        // 2. جلب الملفات داخل الفولدر ده
        const filesRes = await drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, webViewLink, mimeType, thumbnailLink)',
        });

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(filesRes.data.files),
        };

    } catch (error) {
        console.error("Drive API Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
    }
};