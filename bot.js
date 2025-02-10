const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

// تحميل التوكن من المتغيرات البيئية أو استخدام قيمة افتراضية
const TOKEN = process.env.TOKEN || "7733359265:AAFOs2Jqssu3T4oEnW0oPew7iPhK564PSUE";
const QUESTIONS = [
    { question: "ما هو ترتيب شهر رمضان في السنة الهجرية؟", options: ["7", "8", "9", "10"], answer: "9" },
    { question: "ما هو حكم صيام رمضان؟", options: ["مستحب", "واجب", "مكروه", "مباح"], answer: "واجب" },
];

// مسار ملف حفظ بيانات المستخدمين
const USER_DATA_FILE = path.join(__dirname, 'user_data.json');
let userProgress = {};

// تحميل بيانات المستخدمين من الملف
function loadUserData() {
    try {
        if (fs.existsSync(USER_DATA_FILE)) {
            userProgress = JSON.parse(fs.readFileSync(USER_DATA_FILE));
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// حفظ بيانات المستخدمين إلى الملف
function saveUserData() {
    try {
        if (Object.keys(userProgress).length > 0) {
            fs.writeFileSync(USER_DATA_FILE, JSON.stringify(userProgress, null, 2));
        }
    } catch (error) {
        console.error('Error saving user data:', error);
    }
}

// تنظيف بيانات المستخدمين من الرسائل المحذوفة
function cleanUserProgress() {
    for (const userId in userProgress) {
        if (userProgress[userId].messageIds.length === 0) {
            delete userProgress[userId];
        }
    }
    saveUserData();
}

// حذف الرسائل السابقة
async function deletePreviousMessages(ctx) {
    const userId = ctx.from.id;
    if (userProgress[userId] && userProgress[userId].messageIds) {
        for (const msgId of userProgress[userId].messageIds) {
            try {
                await ctx.deleteMessage(msgId);
            } catch (error) {
                if (error.response && error.response.error_code === 400 && error.response.description.includes('message to delete not found')) {
                    // تجاهل الخطأ إذا كانت الرسالة غير موجودة
                    console.log(`Message ${msgId} not found, skipping deletion.`);
                } else {
                    // إذا كان الخطأ غير متوقع، قم بتسجيله
                    console.error('Error deleting message:', error);
                }
            }
        }
        userProgress[userId].messageIds = [];
    }
}

// بدء البوت وعرض القائمة الرئيسية
async function start(ctx) {
    const userId = ctx.from.id;
    await deletePreviousMessages(ctx);
    const message = await ctx.reply(
        "مرحبًا بك! 👋\nاضغط على Start للبدء.",
        Markup.keyboard([["Start"]]).resize()
    );
    if (!userProgress[userId]) {
        userProgress[userId] = { messageIds: [] };
    }
    userProgress[userId].messageIds.push(message.message_id);
    saveUserData();
}

// القائمة الرئيسية
async function toMainMenu(ctx) {
    const userId = ctx.from.id;
    await deletePreviousMessages(ctx);
    const message = await ctx.reply(
        "اختر أحد الخيارات:",
        Markup.keyboard([["الأسئلة 🤓", "أذكار ❤️‍🩹"], ["القرءان الكريم 📖😍", "تلاوة 🥰"], ["رجوع 💢"]]).resize()
    );
    userProgress[userId].messageIds = [message.message_id];
    saveUserData();
}

// قائمة الأذكار
async function azkarMenu(ctx) {
    const userId = ctx.from.id;
    await deletePreviousMessages(ctx);
    const message = await ctx.reply(
        "اختر نوع الأذكار:",
        Markup.keyboard([["أذكار الصباح ☀", "أذكار المساء 🌝"], ["رجوع 💢"]]).resize()
    );
    userProgress[userId].messageIds = [message.message_id];
    saveUserData();
}

// قائمة أذكار الصباح
async function morningAzkarMenu(ctx) {
    const userId = ctx.from.id;
    await deletePreviousMessages(ctx);
    const buttons = [];
    for (let i = 1; i <= 10; i++) {
        buttons.push([`الذكر ${i}`]);
    }
    buttons.push(["رجوع 💢"]);
    const message = await ctx.reply(
        "اختر ذكرًا من أذكار الصباح:",
        Markup.keyboard(buttons).resize()
    );
    userProgress[userId].messageIds = [message.message_id];
    saveUserData();
}

// قائمة أذكار المساء
async function eveningAzkarMenu(ctx) {
    const userId = ctx.from.id;
    await deletePreviousMessages(ctx);
    const buttons = [];
    for (let i = 1; i <= 10; i++) {
        buttons.push([`الذكر ${i}`]);
    }
    buttons.push(["رجوع 💢"]);
    const message = await ctx.reply(
        "اختر ذكرًا من أذكار المساء:",
        Markup.keyboard(buttons).resize()
    );
    userProgress[userId].messageIds = [message.message_id];
    saveUserData();
}

// محتوى أذكار الصباح
const morningAzkar = [
    "أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد، وهو على كل شيء قدير. ربِّ أسألك خير ما في هذا اليوم وخير ما بعده، وأعوذ بك من شر ما في هذا اليوم وشر ما بعده، ربِّ أعوذ بك من الكسل وسوء الكبر، ربِّ أعوذ بك من عذاب في النار وعذاب في القبر.",
    "اللهم بك أصبحنا وبك أمسينا، وبك نحيا وبك نموت وإليك النشور.",
    "اللهم أنت ربي، لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت، أعوذ بك من شر ما صنعت، أبوء لك بنعمتك عليَّ، وأبوء بذنبي، فاغفر لي، فإنه لا يغفر الذنوب إلا أنت.",
    "اللهم إني أسألك العافية في الدنيا والآخرة، اللهم إني أسألك العفو والعافية في ديني ودنياي وأهلي ومالي، اللهم استر عوراتي، وآمن روعاتي، اللهم احفظني من بين يديَّ ومن خلفي، وعن يميني وعن شمالي، ومن فوقي، وأعوذ بعظمتك أن أغتال من تحتي.",
    "رضيت بالله ربًّا، وبالإسلام دينًا، وبمحمد صلى الله عليه وسلم نبيًّا. (ثلاث مرات)",
    "بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم. (ثلاث مرات)",
    "حسبي الله لا إله إلا هو، عليه توكلت، وهو رب العرش العظيم. (سبع مرات)",
    "اللهم صل وسلم على نبينا محمد. (عشر مرات)",
    "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد، وهو على كل شيء قدير. (مئة مرة أو عشر مرات)",
    "أعوذ بكلمات الله التامات من شر ما خلق. (ثلاث مرات)"
];

// محتوى أذكار المساء
const eveningAzkar = [
    "أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد، وهو على كل شيء قدير. ربِّ أسألك خير ما في هذه الليلة وخير ما بعدها، وأعوذ بك من شر ما في هذه الليلة وشر ما بعدها، ربِّ أعوذ بك من الكسل وسوء الكبر، ربِّ أعوذ بك من عذاب في النار وعذاب في القبر.",
    "اللهم بك أمسينا وبك أصبحنا، وبك نحيا وبك نموت وإليك المصير.",
    "اللهم أنت ربي، لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت، أعوذ بك من شر ما صنعت، أبوء لك بنعمتك عليَّ، وأبوء بذنبي، فاغفر لي، فإنه لا يغفر الذنوب إلا أنت.",
    "اللهم إني أسألك العافية في الدنيا والآخرة، اللهم إني أسألك العفو والعافية في ديني ودنياي وأهلي ومالي، اللهم استر عوراتي، وآمن روعاتي، اللهم احفظني من بين يديَّ ومن خلفي، وعن يميني وعن شمالي، ومن فوقي، وأعوذ بعظمتك أن أغتال من تحتي.",
    "رضيت بالله ربًّا، وبالإسلام دينًا، وبمحمد صلى الله عليه وسلم نبيًّا. (ثلاث مرات)",
    "بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم. (ثلاث مرات)",
    "حسبي الله لا إله إلا هو، عليه توكلت، وهو رب العرش العظيم. (سبع مرات)",
    "اللهم صل وسلم على نبينا محمد. (عشر مرات)",
    "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد، وهو على كل شيء قدير. (مئة مرة أو عشر مرات)",
    "أعوذ بكلمات الله التامات من شر ما خلق. (ثلاث مرات)"
];

// عرض ذكر معين من أذكار الصباح
async function showMorningAzkar(ctx, index) {
    const userId = ctx.from.id;
    await deletePreviousMessages(ctx);
    if (index >= 0 && index < morningAzkar.length) {
        const message = await ctx.reply(
            `📖 *الذكر ${index + 1}:*\n${morningAzkar[index]}`,
            {
                parse_mode: "Markdown",
                ...Markup.inlineKeyboard([
                    Markup.button.callback("المواصلة ➡️", `morning_${index + 1}`),
                    Markup.button.callback("العودة 🔙", "back_to_morning_menu")
                ])
            }
        );
        userProgress[userId].messageIds = [message.message_id];
        saveUserData();
    }
}

// عرض ذكر معين من أذكار المساء
async function showEveningAzkar(ctx, index) {
    const userId = ctx.from.id;
    await deletePreviousMessages(ctx);
    if (index >= 0 && index < eveningAzkar.length) {
        const message = await ctx.reply(
            `📖 *الذكر ${index + 1}:*\n${eveningAzkar[index]}`,
            {
                parse_mode: "Markdown",
                ...Markup.inlineKeyboard([
                    Markup.button.callback("المواصلة ➡️", `evening_${index + 1}`),
                    Markup.button.callback("العودة 🔙", "back_to_evening_menu")
                ])
            }
        );
        userProgress[userId].messageIds = [message.message_id];
        saveUserData();
    }
}

// تهيئة البوت
const bot = new Telegraf(TOKEN);
loadUserData();

// الأوامر
bot.start(start);
bot.hears("Start", toMainMenu);
bot.hears("الأسئلة 🤓", (ctx) => ctx.reply("هذه الميزة غير متاحة حاليًا."));
bot.hears("أذكار ❤️‍🩹", azkarMenu);
bot.hears("القرءان الكريم 📖😍", (ctx) => ctx.reply("هذه الميزة غير متاحة حاليًا."));
bot.hears("تلاوة 🥰", (ctx) => ctx.reply("هذه الميزة غير متاحة حاليًا."));
bot.hears("رجوع 💢", toMainMenu);
bot.hears("أذكار الصباح ☀", morningAzkarMenu);
bot.hears("أذكار المساء 🌝", eveningAzkarMenu);

// معالجة أذكار الصباح
for (let i = 0; i < 10; i++) {
    bot.hears(`الذكر ${i + 1}`, (ctx) => showMorningAzkar(ctx, i));
    bot.action(`morning_${i + 1}`, (ctx) => showMorningAzkar(ctx, i));
}

// معالجة أذكار المساء
for (let i = 0; i < 10; i++) {
    bot.hears(`الذكر ${i + 1}`, (ctx) => showEveningAzkar(ctx, i));
    bot.action(`evening_${i + 1}`, (ctx) => showEveningAzkar(ctx, i));
}

// الرجوع إلى قائمة أذكار الصباح
bot.action("back_to_morning_menu", (ctx) => morningAzkarMenu(ctx));

// الرجوع إلى قائمة أذكار المساء
bot.action("back_to_evening_menu", (ctx) => eveningAzkarMenu(ctx));

// تشغيل البوت باستخدام Long Polling
bot.launch({ polling: true }).then(() => {
    console.log("Bot is running...");
}).catch((error) => {
    console.error("Error starting bot:", error);
});

// إغلاق البوت بشكل أنيق عند إيقاف التشغيل
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// تنظيف بيانات المستخدمين عند بدء التشغيل
cleanUserProgress();
