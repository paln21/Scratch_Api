const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const inquirer = require('inquirer');

// --- 翻訳データ (Dictionary) ---
const DICTIONARY = {
    en: {
        title: '=== Scratch Login Tool ===',
        ask_lang: 'Select Language / 言語を選択してください:',
        ask_username: 'Enter your Username:',
        ask_password: 'Enter your Password:',
        valid_req: 'This field is required.',
        step_csrf: '1. Fetching CSRF Token...',
        step_csrf_ok: '   CSRF Token acquired:',
        step_csrf_fail: 'Failed to fetch CSRF Token.',
        step_login: '2. Attempting Login...',
        auth_success: '\n--- Authentication Successful! ---',
        auth_fail: 'Login Failed: Incorrect username or password.',
        cookie_saved: '(Cookies have been saved to the Jar)',
        next_step: '(Next Step: You can now use this X-Token for API requests)',
        err_status: 'Error: Server returned status code',
        err_generic: 'Error:'
    },
    ja: {
        title: '=== Scratch ログインツール ===',
        ask_lang: 'Select Language / 言語を選択してください:',
        ask_username: 'ユーザー名を入力してください:',
        ask_password: 'パスワードを入力してください:',
        valid_req: '入力は必須です。',
        step_csrf: '1. CSRFトークンを取得中...',
        step_csrf_ok: '   取得成功:',
        step_csrf_fail: 'CSRFトークンの取得に失敗しました。',
        step_login: '2. ログインを実行中...',
        auth_success: '\n--- 認証成功! ---',
        auth_fail: 'ログイン失敗: ユーザー名またはパスワードが間違っています。',
        cookie_saved: '(Cookieは正常にJarに保存されました)',
        next_step: '(次のステップ: このX-Tokenを使ってAPI操作が可能です)',
        err_status: 'エラー: サーバーがステータスコードを返しました:',
        err_generic: 'エラー:'
    }
};

// 現在の言語を保持する変数 (デフォルトは英語)
let currentLang = 'en';

// テキスト取得ヘルパー関数
function t(key) {
    return DICTIONARY[currentLang][key] || key;
}

// --- HTTPクライアント設定 ---
const jar = new CookieJar();
const client = wrapper(axios.create({
    jar,
    withCredentials: true,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://scratch.mit.edu/'
    }
}));

// --- メイン処理 ---
async function main() {
    
    // 1. 言語選択
    const langChoice = await inquirer.prompt([
        {
            type: 'list',
            name: 'lang',
            message: 'Select Language / 言語を選択してください:',
            choices: [
                { name: 'English', value: 'en' },
                { name: '日本語', value: 'ja' }
            ]
        }
    ]);
    
    currentLang = langChoice.lang;

    console.log(`\n${t('title')}\n`);

    // 2. ユーザー入力
    const credentials = await inquirer.prompt([
        {
            type: 'input',
            name: 'username',
            message: t('ask_username'),
            validate: input => input ? true : t('valid_req')
        },
        {
            type: 'password',
            name: 'password',
            message: t('ask_password'),
            mask: '*',
            validate: input => input ? true : t('valid_req')
        }
    ]);

    // 3. ログイン実行
    await loginAndGetToken(credentials.username, credentials.password);
}

// --- ログインロジック ---
async function loginAndGetToken(username, password) {
    try {
        console.log(t('step_csrf'));
        
        // CSRFトークン取得
        await client.get('https://scratch.mit.edu/csrf_token/');

        const cookies = await jar.getCookies('https://scratch.mit.edu');
        const csrfCookie = cookies.find(c => c.key === 'scratchcsrftoken');
        
        if (!csrfCookie) {
            throw new Error(t('step_csrf_fail'));
        }
        const csrfToken = csrfCookie.value;
        console.log(`${t('step_csrf_ok')} ${csrfToken}`);

        console.log(t('step_login'));
        
        // ログインリクエスト
        const response = await client.post('https://scratch.mit.edu/accounts/login/', {
            username: username,
            password: password,
            useMessages: true 
        }, {
            headers: {
                'X-CSRFToken': csrfToken
            }
        });

        const userData = response.data[0];

        if (userData && userData.token) {
            console.log(t('auth_success'));
            console.log(`Username: ${userData.username}`);
            console.log(`User ID : ${userData.id}`);
            console.log(`X-Token : ${userData.token}`);
            
            console.log(`\n${t('cookie_saved')}`);
            console.log(t('next_step'));
            
            return userData.token;
        } else {
            console.error(t('auth_fail'));
        }

    } catch (error) {
        if (error.response) {
            console.error(`${t('err_status')} ${error.response.status}`);
        } else {
            console.error(`${t('err_generic')} ${error.message}`);
        }
    }
}

// 実行開始
main();