### **前端认证机制文档**

#### 概述

本前端项目采用 Supabase Auth 进行用户认证和授权管理。核心目标是实现安全、高效且用户友好的认证流程。我们特别关注了 `access_token` 和 `refresh_token` 的存储安全性，以遵循行业最佳实践。

#### 核心机制

项目通过使用 `@supabase/ssr` 包中的 `createBrowserClient` 来初始化 Supabase 客户端，该客户端通过 `src/lib/supabase.ts` 中的 `createClientComponentClient` 函数导出。这种配置方式确保了以下安全机制：

1.  **`refresh_token` 存储在 HttpOnly 和 Secure Cookie 中**：
    *   `refresh_token` 具有较长的生命周期，用于在 `access_token` 过期后获取新的 `access_token`。
    *   通过将其存储在 HttpOnly Cookie 中，可以有效防止跨站脚本 (XSS) 攻击直接访问和窃取 `refresh_token`。
    *   `Secure` 标志确保 Cookie 只通过 HTTPS 连接发送，进一步增强了安全性。

2.  **`access_token` 存储在内存中**：
    *   `access_token` 具有较短的生命周期，用于认证每次 API 请求。
    *   它通常在客户端内存中管理，或者在需要时从 HttpOnly Cookie 中获取并存储在内存中。
    *   由于其短生命周期和内存存储，即使被窃取，其有效使用时间也极其有限，降低了风险。

#### 认证流程简述

1.  **用户登录**：用户通过 Supabase 提供的认证方法（如邮箱/密码、OAuth 等）进行登录。
2.  **Token 获取**：Supabase 认证服务成功后，会向客户端返回 `access_token` 和 `refresh_token`。
3.  **Token 存储**：
    *   `createBrowserClient` 会自动将 `refresh_token` 设置为 HttpOnly 和 Secure Cookie。
    *   `access_token` 则在客户端内存中管理。
4.  **API 请求**：前端在发起受保护的 API 请求时，会将 `access_token` 附加到请求的 `Authorization` Header 中（通常是 `Bearer` 令牌）。
5.  **Token 验证**：后端接收到请求后，会验证 `access_token` 的有效性（签名、过期时间等）。
6.  **Token 刷新**：当 `access_token` 过期时，Supabase 客户端会自动使用 HttpOnly Cookie 中的 `refresh_token` 向 Supabase 认证服务请求新的 `access_token`。这个过程对用户是透明的。

#### 安全性考量

*   **XSS 防御**：HttpOnly Cookie 有效地缓解了 XSS 攻击对 `refresh_token` 的窃取风险。
*   **CSRF 防御**：虽然 HttpOnly Cookie 有助于防止 XSS，但对于 CSRF (Cross-Site Request Forgery) 攻击，仍需额外的防护措施（例如，使用 CSRF Token 或 SameSite Cookie 策略）。Supabase 客户端通常会处理这些。
*   **短生命周期 `access_token`**：限制了被窃取 `access_token` 的有效时间。
*   **HTTPS/SSL**：所有通信都通过 HTTPS 进行，确保数据传输的加密和完整性。

#### 优化建议

1.  **统一 Supabase 客户端实例**：
    *   目前 `src/lib/supabase.ts` 同时导出了 `createClientComponentClient` (使用 `createBrowserClient`) 和 `supabase` (使用 `createClient`)。
    *   建议确保所有需要安全 token 存储的客户端组件都使用 `createClientComponentClient`。
    *   如果 `supabase` 常量（使用 `createClient`）不再被需要，可以考虑将其移除，以避免开发者误用可能将 token 存储在 `localStorage` 中的实例。如果需要保留，请添加明确的注释说明其用途和与 `createClientComponentClient` 的区别。

---