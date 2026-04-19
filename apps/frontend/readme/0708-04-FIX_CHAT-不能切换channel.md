我发现问题所在，URL变化时未正确更新`currentChannelId`。需要在`GlobalChat`组件中监听URL参数变化并更新当前选中的频道。
Read file: apps/frontend/src/stores/chat.ts
Read file: apps/frontend/src/app/[locale]/(main)/chat/page.tsx
Read file: apps/frontend/src/app/[locale]/(main)/chat/_components/chat/chat-room.tsx
这部分代码看起来是正确的，让我们检查一下`ChatRoom`组件是否正确使用了`channelId`来获取消息。
我们还需要对`CachedChatPage`组件进行调整，确保它可以从URL参数获取channelId。
现在需要更新`GlobalChat`组件，使其接受`initialChannelId`属性：
我还需要添加一个到`apps/frontend/src/app/[locale]/(main)/chat/[channelId]/page.tsx`的路由，以处理另一种路由格式：
Ran tool
让我们查看这个路由页面：
Read file: /Users/luke/Synaply/apps/frontend/src/app/[locale]/(main)/chat/channels/[channelId]/page.tsx
我们需要更新这个页面，使其也使用`CachedChatPage`组件：
这些修改应该能够解决问题了。总结一下我们做了以下更改：

1. 在`GlobalChat`组件中:
   - 添加了`initialChannelId`属性
   - 增加了对URL查询参数`channelId`的监听
   - 当URL参数变化时，更新`currentChannelId`

2. 更新了`CachedChatPage`组件，使其从URL获取`channelId`并传递给`GlobalChat`

3. 统一了所有聊天相关的路由页面，使它们都使用`CachedChatPage`组件:
   - `/chat` 基本页面
   - `/chat/[chatId]` 动态路由页面
   - `/chat/channels/[channelId]` 频道路由页面

4. 添加了日志记录，方便调试channelId的变化

这些修改确保了当用户点击侧边栏中的聊天频道时，会更新URL参数，进而触发`currentChannelId`的更新，从而使`ChatRoom`组件加载正确的消息。

现在，不论是点击公共聊天、私聊还是群聊，都应该能够正确切换消息来源了。