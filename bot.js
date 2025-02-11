const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.TOKEN || "YOUR_BOT_TOKEN";
const QUESTIONS = [
    { question: "ما هو ترتيب شهر رمضان في السنة الهجرية؟", options: ["7", "8", "9", "10"], answer: "9" },
    { question: "ما هو حكم صيام رمضان؟", options: ["مستحب", "واجب", "مكروه", "مباح"], answer: "واجب" },
];

const USER_DATA_FILE = path.join(__dirname, 'user_data.json');
let userProgress = {};

// تحميل بيانات المستخدمين
function loadUserData() {
    try {
        if (fs.existsSync(USER_DATA_FILE)) {
            const data = fs.readFileSync(USER_DATA_FILE, 'utf8');
            userProgress = JSON.parse(data);
            if (typeof userProgress !== 'object' || userProgress === null) {
                userProgress = {};
            }
        } else {
            userProgress = {};
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        userProgress = {};
    }
}

// حفظ بيانات المستخدمين
function saveUserData() {
    try {
        fs.writeFileSync(USER_DATA_FILE, JSON.stringify(userProgress, null, 2));
    } catch (error) {
        console.error('Error saving user data:', error);
    }
}

// حذف الرسائل السابقة
async function deletePreviousMessages(ctx) {
    const userId = ctx.from.id;
    if (userProgress[userId]?.messageIds) {
        try {
            await Promise.all(
                userProgress[userId].messageIds.map(msgId => ctx.deleteMessage(msgId).catch(() => {}))
            );
        } catch (error) {
            console.error('Error deleting messages:', error);
        }
        userProgress[userId].messageIds = [];
    }
}

// عرض السؤال الحالي مع حذف الرسائل السابقة
async function showQuestion(ctx, userId) {
    await deletePreviousMessages(ctx);
    const currentQuestionIndex = userProgress[userId]?.currentQuestionIndex || 0;

    if (currentQuestionIndex < QUESTIONS.length) {
        const question = QUESTIONS[currentQuestionIndex];
        const buttons = question.options.map(option => Markup.button.callback(option, `answer_${option}`));
        
        const message = await ctx.reply(
            `❓ *السؤال ${currentQuestionIndex + 1}:*\n${question.question}`,
            {
                parse_mode: "Markdown",
                ...Markup.inlineKeyboard(buttons)
            }
        );
        
        userProgress[userId].messageIds = [message.message_id];
        saveUserData();
    } else {
        const message = await ctx.reply(
            "🎉 لقد انتهيت من جميع الأسئلة!",
            Markup.inlineKeyboard([
                Markup.button.callback("🔙 العودة إلى القائمة الرئيسية", "back_to_main_menu")
            ])
        );
        userProgress[userId].messageIds = [message.message_id];
    }
}

// معالجة الإجابات
async function handleAnswer(ctx) {
    const userId = ctx.from.id;
    const userAnswer = ctx.callbackQuery.data.replace('answer_', '');
    const currentQuestionIndex = userProgress[userId]?.currentQuestionIndex || 0;
    const question = QUESTIONS[currentQuestionIndex];

    if (!userProgress[userId]) return;

    if (userAnswer === question.answer) {
        await ctx.reply("✅ إجابة صحيحة!");
        userProgress[userId].currentQuestionIndex += 1;
        await showQuestion(ctx, userId);
    } else {
        await ctx.reply("❌ إجابة خاطئة! حاول مرة أخرى.");
    }
    saveUserData();
}

// دعم إرسال الإجابة نصيًا
async function handleTextAnswer(ctx) {
    const userId = ctx.from.id;
    const userAnswer = ctx.message.text.trim();
    const currentQuestionIndex = userProgress[userId]?.currentQuestionIndex || 0;

    if (!userProgress[userId] || currentQuestionIndex >= QUESTIONS.length) return;

    const question = QUESTIONS[currentQuestionIndex];

    if (userAnswer === question.answer) {
        await ctx.reply("✅ إجابة صحيحة!");
        userProgress[userId].currentQuestionIndex += 1;
        await showQuestion(ctx, userId);
    } else {
        await ctx.reply("❌ إجابة خاطئة! حاول مرة أخرى.");
    }
    saveUserData();
}

// تهيئة البوت
const bot = new Telegraf(TOKEN);
loadUserData();

bot.start(async (ctx) => {
    const userId = ctx.from.id;
    await deletePreviousMessages(ctx);
    const message = await ctx.reply(
        "مرحبًا بك! 👋\nاضغط على Start للبدء.",
        Markup.keyboard([["Start"]]).resize()
    );
    
    userProgress[userId] = { messageIds: [message.message_id], currentQuestionIndex: 0 };
    saveUserData();
});

bot.hears("Start", async (ctx) => {
    const userId = ctx.from.id;
    await deletePreviousMessages(ctx);
    const message = await ctx.reply(
        "اختر أحد الخيارات:",
        Markup.keyboard([["الأسئلة 🤓", "أذكار ❤️‍🩹"], ["القرءان الكريم 📖😍", "تلاوة 🥰"], ["رجوع 💢"]]).resize()
    );
    
    userProgress[userId].messageIds = [message.message_id];
    saveUserData();
});

bot.hears("الأسئلة 🤓", async (ctx) => {
    const userId = ctx.from.id;
    userProgress[userId] = { messageIds: [], currentQuestionIndex: 0 };
    await showQuestion(ctx, userId);
});

// دعم إرسال الإجابة نصيًا
bot.on("text", handleTextAnswer);

// معالجة الأزرار
bot.action(/answer_/, handleAnswer);
bot.action("back_to_main_menu", async (ctx) => {
    await ctx.reply("🔙 تمت إعادتك إلى القائمة الرئيسية.");
});

// تشغيل البوت
bot.launch().then(() => console.log("Bot is running...")).catch(console.error);

// تنظيف عند الإيقاف
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
