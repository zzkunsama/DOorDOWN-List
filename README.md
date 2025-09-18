# 个人代办清单工具

一个简洁的个人任务管理工具，支持待办事项 (dolist) 和已完成事项 (downlist) 管理，并提供跨设备数据同步功能。

## 功能特点

- 简洁直观的用户界面，适配手机和电脑
- 待办事项 (dolist) 管理：添加、编辑、标记完成、删除
- 已完成事项 (downlist) 记录：按日 / 按月查看历史完成记录
- 数据同步：支持本地数据与云端同步，包含数据差异比对
- 数据导入导出：支持 JSON 格式备份和恢复

## 系统架构

- 前端：单页 HTML 应用，可本地打开使用
- 后端：基于 Node.js 的轻量服务，负责数据存储和同步
- 存储：本地使用浏览器 localStorage，云端使用文件存储

## 服务端部署

### 前提条件

- 已安装 Docker 环境

### 部署步骤

1. **加载镜像**

   ```bash
   docker load -i task-manager.tar
   ```

2. **启动容器**

   ```bash
   docker run -d \
     -p 3000:3000 \
     -v taskdata:/app/data \
     -e ADMIN_TOKEN="admin" \  # 替换为你的管理员令牌
     --name task-manager \
     task-manager
   ```

3. **验证部署**

   检查容器是否正常运行：

   ```bash
   docker ps | grep task-manager
   ```

   查看数据卷是否创建：

   ```bash
   docker volume ls
   ```

## 管理操作

### 查看容器日志

```bash
docker logs task-manager
```

### 生成用户 API 密钥

使用管理员令牌创建新的用户 API 密钥：

```bash
curl -X POST -H "Admin-Token: admin" http://localhost:3000/api/generate-key
```

成功响应示例：

```json
{"success":true,"apiKey":"a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"}
```

### 查看已存在的 API 密钥

```bash
docker exec -it task-manager cat /app/api-keys.json
```

### 停止 / 启动容器

```bash
# 停止容器
docker stop task-manager

# 启动容器
docker start task-manager
```

## 前端使用

1. 将前端 HTML 文件保存到本地
2. 用浏览器打开该 HTML 文件
3. 点击右上角 "同步" 按钮
4. 输入服务器地址（如：`http://你的服务器IP:3000`）
5. 输入通过上面步骤生成的 API 密钥
6. 开始使用应用管理你的任务

## 安全注意事项

1. **管理员令牌**：请将默认的 "admin" 替换为强密码，并妥善保管
2. **API 密钥**：每个用户应使用独立的 API 密钥，定期轮换
3. **网络访问**：建议在生产环境中配置 HTTPS，增强数据传输安全性
4. **权限管理**：仅将 API 密钥分发给授权用户

## 数据备份

用户数据存储在 Docker 数据卷`taskdata`中，可通过以下方式备份：

```bash
# 备份数据卷
docker run --rm -v taskdata:/source -v $(pwd):/backup alpine tar -czvf /backup/taskdata-backup.tar.gz -C /source .
```

## 常见问题

1. **同步失败**：检查服务器地址是否正确、API 密钥是否有效、网络连接是否正常
2. **无法生成 API 密钥**：检查管理员令牌是否正确，容器是否有写入权限
3. **数据丢失**：确保使用了数据卷挂载（`-v taskdata:/app/data`），否则容器删除后数据会丢失

## 联系方式

如有问题或建议，请联系开发者。