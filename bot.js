const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000; // استخدام المنفذ المحدد في البيئة أو 3000 كمنفذ افتراضي

const TOKEN = "7733359265:AAFOs2Jqssu3T4oEnW0oPew7iPhK564PSUE"; // استبدل التوكن هنا
const QUESTIONS = [
    { question: "ما هو ترتيب شهر رمضان في السنة الهجرية؟", options: ["7", "8", "9", "10"], answer: "9" },
    { question: "ما هو حكم صيام رمضان؟", options: ["مستحب", "واجب", "مكروه", "مباح"], answer: "واجب" },
];

let userProgress = {};
const USER_DATA_FILE = "user_data.json";

function saveUserData() {
    fs.writeFileSync(USER_DATA_FILE, JSON.stringify(userProgress));
}

function loadUserData() {
    try {
        userProgress = JSON.parse(fs.readFileSync(USER_DATA_FILE)) || {};
    } catch (e) {
        userProgress = {};
    }
}

async function deletePreviousMessages(ctx) {
    const userId = ctx.from.id;
    if (userProgress[userId]?.messageIds) {
        for (const msgId of userProgress[userId].messageIds) {
            try {
                await ctx.deleteMessage(msgId);
            } catch (e) {}
        }
    }
    userProgress[userId].messageIds = [];
}

async function start(ctx) {
    const userId = ctx.from.id;
    await deletePreviousMessages(ctx);
    const message = await ctx.reply("مرحبا بك! اضغط على Start للبدء.", Markup.keyboard([["Start"]]).resize());
    userProgress[userId] = { messageIds: [message.message_id] };
    saveUserData();
}

async function toMainMenu(ctx) {
    const userId = ctx.from.id;
    await deletePreviousMessages(ctx);
    const message = await ctx.reply("اختر أحد الخيارات:", Markup.keyboard([["الأسئلة 🧠"], ["رجوع"]]).resize());
    userProgress[userId].messageIds = [message.message_id];
    saveUserData();
}

async function questionsHandler(ctx) {
    const userId = ctx.from.id;
    userProgress[userId] = { score: 0, currentQuestion: 0, messageIds: [] };
    await sendQuestion(ctx);
}

async function sendQuestion(ctx) {
    const userId = ctx.from.id;
    const userData = userProgress[userId];
    if (!userData) return;

    await deletePreviousMessages(ctx);
    const questionData = QUESTIONS[userData.currentQuestion];
    if (!questionData) return;

    const keyboard = Markup.inlineKeyboard(questionData.options.map((opt, i) => Markup.button.callback(opt, `answer_${i}`)));
    const message = await ctx.reply(`❓ *السؤال ${userData.currentQuestion + 1}:*\n${questionData.question}`, { parse_mode: "Markdown", ...keyboard });
    userData.messageIds = [message.message_id];
    saveUserData();
}

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
        const message = await ctx.reply("✅ إجابة صحيحة!", Markup.inlineKeyboard([Markup.button.callback("المواصلة", "continue")]));
        userData.messageIds = [message.message_id];
    } else {
        userData.messageIds = [];
        const message = await ctx.reply("❌ إجابة خاطئة! حاول مرة أخرى.", Markup.inlineKeyboard([Markup.button.callback("إعادة المحاولة", "retry")]));
        userData.messageIds = [message.message_id];
    }
    saveUserData();
}

async function continueHandler(ctx) {
    const userId = ctx.from.id;
    const userData = userProgress[userId];
    if (!userData) return;

    userData.currentQuestion += 1;
    if (userData.currentQuestion < QUESTIONS.length) {
        await sendQuestion(ctx);
    } else {
        await deletePreviousMessages(ctx);
        const message = await ctx.reply(`🎉 انتهيت من الأسئلة!\n\nالنتيجة: ${userData.score}/${QUESTIONS.length}`, Markup.inlineKeyboard([Markup.button.callback("رجوع", "back_to_main")]));
        userData.messageIds = [message.message_id];
    }
    saveUserData();
}

async function retryHandler(ctx) {
    await sendQuestion(ctx);
}

async function backToMainHandler(ctx) {
    await toMainMenu(ctx);
}

// إعداد نقطة فحص الصحة
app.get('/health', (req, res) => {
    res.status(200).send('Bot is running!');
});

// بدء الخادم على منفذ مختلف
const healthCheckPort = 3001; // منفذ مختلف لمنع التعارض
app.listen(healthCheckPort, () => {
    console.log(`Health check server is running on http://localhost:${healthCheckPort}`);
});

// إطلاق البوت بدون تكامل الويب هوك
const bot = new Telegraf(TOKEN);
loadUserData();

bot.start(start);
bot.hears("Start", toMainMenu);
bot.hears("الأسئلة 🧠", questionsHandler);
bot.action(/answer_\d+/, checkAnswer);
bot.action("retry", retryHandler);
bot.action("continue", continueHandler);
bot.action("back_to_main", backToMainHandler);

// تشغيل البوت
bot.launch().then(() => {
    console.log("Bot started...");
}).catch((err) => {
    console.error("Failed to start bot:", err);
});
