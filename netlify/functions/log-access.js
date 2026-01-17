const { google } = require('googleapis');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { patientId, fileName } = JSON.parse(event.body);
        const sheetId = process.env.GOOGLE_SHEET_ID; // هنجيبه من الإعدادات

        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        const sheets = google.sheets({ version: 'v4', auth });

        // الوقت الحالي بتوقيت مصر تقريباً
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-GB'); // DD/MM/YYYY
        const timeStr = now.toLocaleTimeString('en-US', { hour12: true });

        // إضافة صف جديد في الشيت
        await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: 'Sheet1!A:D', // افترضنا اسم الورقة Sheet1
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [
                    [dateStr, timeStr, patientId, fileName]
                ]
            }
        });

        return { statusCode: 200, body: "Logged" };

    } catch (error) {
        console.error("Sheets API Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};