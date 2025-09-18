const express = require('express');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const API_KEYS_FILE = path.join(__dirname, 'api-keys.json');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-secure-admin-token'; // 管理员令牌

// 确保数据目录存在
if (!fsSync.existsSync(DATA_DIR)) {
    fsSync.mkdirSync(DATA_DIR, { recursive: true });
}

// 确保API密钥文件存在
if (!fsSync.existsSync(API_KEYS_FILE)) {
    fsSync.writeFileSync(API_KEYS_FILE, JSON.stringify([]));
}

// 中间件
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Admin-Token']
}));
app.use(express.json());

// 验证API密钥的中间件（用户访问）
async function validateApiKey(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未提供API密钥' });
    }
    
    const apiKey = authHeader.split(' ')[1];
    
    try {
        const keysData = await fs.readFile(API_KEYS_FILE, 'utf8');
        const validKeys = JSON.parse(keysData);
        
        if (validKeys.includes(apiKey)) {
            req.username = apiKey;
            next();
        } else {
            res.status(403).json({ error: '无效的API密钥' });
        }
    } catch (error) {
        console.error('验证API密钥时出错:', error);
        res.status(500).json({ error: '服务器错误' });
    }
}

// 验证管理员令牌的中间件（保护敏感接口）
function validateAdminToken(req, res, next) {
    const adminToken = req.headers['admin-token'];
    
    if (!adminToken || adminToken !== ADMIN_TOKEN) {
        return res.status(403).json({ error: '无权访问，需要管理员令牌' });
    }
    
    next();
}

// 获取用户数据文件路径
function getUserDataPath(username) {
    const hash = require('crypto').createHash('md5').update(username).digest('hex');
    return path.join(DATA_DIR, `${hash}.txt`);
}

// 获取数据
app.get('/api/data', validateApiKey, async (req, res) => {
    try {
        const dataPath = getUserDataPath(req.username);
        
        try {
            await fs.access(dataPath);
        } catch {
            return res.json({
                dolist: [],
                downlist: [],
                updatedAt: null
            });
        }
        
        const data = await fs.readFile(dataPath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('获取数据时出错:', error);
        res.status(500).json({ error: '获取数据失败' });
    }
});

// 保存数据
app.post('/api/data', validateApiKey, async (req, res) => {
    try {
        const data = {
            dolist: req.body.dolist || [],
            downlist: req.body.downlist || [],
            updatedAt: new Date().toISOString()
        };
        
        const dataPath = getUserDataPath(req.username);
        await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
        
        res.json({ success: true, message: '数据已保存', updatedAt: data.updatedAt });
    } catch (error) {
        console.error('保存数据时出错:', error);
        res.status(500).json({ error: '保存数据失败' });
    }
});

// 生成新的API密钥（仅管理员可访问）
app.post('/api/generate-key', validateAdminToken, async (req, res) => {
    try {
        const keysData = await fs.readFile(API_KEYS_FILE, 'utf8');
        const validKeys = JSON.parse(keysData);
        
        // 生成随机API密钥
        const newKey = require('crypto').randomBytes(16).toString('hex');
        
        // 添加到密钥列表
        validKeys.push(newKey);
        await fs.writeFile(API_KEYS_FILE, JSON.stringify(validKeys, null, 2));
        
        res.json({ success: true, apiKey: newKey });
    } catch (error) {
        console.error('生成API密钥时出错:', error);
        res.status(500).json({ error: '生成API密钥失败' });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('数据存储目录:', DATA_DIR);
    console.log('API密钥文件:', API_KEYS_FILE);
});
