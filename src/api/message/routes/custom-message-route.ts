export default {
    routes: [
  {
    method: "POST",
    path: "/messages",
    handler: "custom-message.createMessage",
    config: { auth: false }
  },
  {
    method: "GET",
    path: "/messages",
    handler: "custom-message.getAllMessages",
    config: { policies: ["admin::isAuthenticatedAdmin"] }
  },
  {
    method: "GET",
    path: "/messages/:id",
    handler: "custom-message.getMessageById",
    config: { policies: ["admin::isAuthenticatedAdmin"] }
  },
  {
    method: "DELETE",
    path: "/messages/:id",
    handler: "custom-message.deleteMessage",
    config: { policies: ["admin::isAuthenticatedAdmin"] }
  }
]
}