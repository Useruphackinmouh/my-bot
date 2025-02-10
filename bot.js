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
        fs.writeFileSync(USER_DATA_FILE, JSON.stringify(userProgress, null, 2));
    } catch (error) {
        console.error('Error saving user data:', error);
    }
}

// حذف الرسائل السابقة
async function deletePreviousMessages(ctx) {
    const userId = ctx.from.id;
    if (userProgress[userId]?.messageIds) {
        for (const msgId of userProgress[userId].messageIds) {
            try {
                await ctx.deleteMessage(msgId);
            } catch (error) {
                console.error('Error deleting message:', error);
            }
        }
        userProgress[userId].messageIds = [];
    }
}

// بدء البوت
async function start(ctx) {
    const userId = ctx.from.id;
    await deletePreviousMessages(ctx);
    const message = await ctx.reply(
        "مرحبا بك! اضغط على Start للبدء.",
        Markup.keyboard([["Start"]]).resize()
    );
    userProgress[userId] = { messageIds: [message.message_id] };
    saveUserData();
}

// القائمة الرئيسية
async function toMainMenu(ctx) {
    const userId = ctx.from.id;
    await deletePreviousMessages(ctx);
    const message = await ctx.reply(
        "اختر أحد الخيارات:",
        Markup.keyboard([["الأسئلة 🧠"], ["رجوع"]]).resize()
    );
    userProgress[userId].messageIds = [message.message_id];
    saveUserData();
}

// تعريف الدالة questionsHandler
async function questionsHandler(ctx) {
    const userId = ctx.from.id;
    userProgress[userId] = { score: 0, currentQuestion: 0, messageIds: [] };
    await sendQuestion(ctx);
}

// إرسال سؤال
async function sendQuestion(ctx) {
    const userId = ctx.from.id;
    const userData = userProgress[userId];
    if (!userData) return;

    await deletePreviousMessages(ctx);
    const questionData = QUESTIONS[userData.currentQuestion];
    if (!questionData) return;

    const keyboard = Markup.inlineKeyboard(
        questionData.options.map((opt, i) => Markup.button.callback(opt, `answer_${i}`))
    );
    const message = await ctx.reply(
        `❓ *السؤال ${userData.currentQuestion + 1}:*\n${questionData.question}`,
        { parse_mode: "Markdown", ...keyboard }
    );
    userData.messageIds = [message.message_id];
    saveUserData();
}

// التحقق من الإجابة
async function checkAnswer(ctx) {
    const userId = ctx.from.id;
    const userData = userProgress[userId];
    if (!userData) return;

    await deletePreviousMessages(ctx);
    const chosenIndex = parseInt(ctx.callbackQuery.data.split("_")[1]);
    const correctAnswer = QUESTIONS[userData.currentQuestion].answer;
    const chosenAnswer = QUESTIONS[userData.currentQuestion].options[chosenIndex];

    if (chosenAnswer === correctAnswer) {
        userData.score += 1;
        const message = await ctx.reply(
            "✅ إجابة صحيحة!",
            Markup.inlineKeyboard([Markup.button.callback("المواصلة", "continue")])
        );
        userData.messageIds = [message.message_id];
    } else {
        const message = await ctx.reply(
            "❌ إجابة خاطئة! حاول مرة أخرى.",
            Markup.inlineKeyboard([Markup.button.callback("إعادة المحاولة", "retry")])
        );
        userData.messageIds = [message.message_id];
    }
    saveUserData();
}

// الانتقال إلى السؤال التالي
async function continueHandler(ctx) {
    const userId = ctx.from.id;
    const userData = userProgress[userId];
    if (!userData) return;

    userData.currentQuestion += 1;
    if (userData.currentQuestion < QUESTIONS.length) {
        await sendQuestion(ctx);
    } else {
        await deletePreviousMessages(ctx);
        const message = await ctx.reply(
            `🎉 انتهيت من الأسئلة!\n\nالنتيجة: ${userData.score}/${QUESTIONS.length}`,
            Markup.inlineKeyboard([Markup.button.callback("رجوع", "back_to_main")])
        );
        userData.messageIds = [message.message_id];
    }
    saveUserData();
}

// إعادة المحاولة
async function retryHandler(ctx) {
    await sendQuestion(ctx);
}

// الرجوع إلى القائمة الرئيسية
async function backToMainHandler(ctx) {
    await toMainMenu(ctx);
}

// تهيئة البوت
const bot = new Telegraf(TOKEN);
loadUserData();

// الأوامر
bot.start(start);
bot.hears("Start", toMainMenu);
bot.hears("الأسئلة 🧠", questionsHandler); // تم تعريف questionsHandler قبل استخدامها
bot.action(/answer_\d+/, checkAnswer);
bot.action("retry", retryHandler);
bot.action("continue", continueHandler);
bot.action("back_to_main", backToMainHandler);

// تشغيل البوت
bot.launch().then(() => {
    console.log("Bot is running...");
}).catch((error) => {
    console.error("Error starting bot:", error);
});

// إغلاق البوت بشكل أنيق عند إيقاف التشغيل
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
