// pagination.ts
module.exports = function getPagination(ctx, defaultPageSize = 10) {
  const page = parseInt(ctx.query.page) || 1;
  const pageSize = parseInt(ctx.query.pageSize) || defaultPageSize;

  const start = (page - 1) * pageSize;
  const limit = pageSize;

  return { start, limit };
};
