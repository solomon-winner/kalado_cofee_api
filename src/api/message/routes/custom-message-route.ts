export default {
    routes: [
  {
    method: "POST",
    path: "/messages",
    handler: "message.createMessage",
    config: { auth: false }
  },
  {
    method: "GET",
    path: "/messages",
    handler: "message.getAllMessages",
    config: { policies: ["admin::isAuthenticatedAdmin"] }
  },
  {
    method: "GET",
    path: "/messages/:id",
    handler: "message.getMessageById",
    config: { policies: ["admin::isAuthenticatedAdmin"] }
  },
  {
    method: "DELETE",
    path: "/messages/:id",
    handler: "message.deleteMessage",
    config: { policies: ["admin::isAuthenticatedAdmin"] }
  }
]
}