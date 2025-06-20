module.exports = function getPaginationMeta(ctx, totalCount, defaultPageSize = 10) {
  const page = parseInt(ctx.query.page) || 1;
  const pageSize = parseInt(ctx.query.pageSize) || defaultPageSize;

  const pageCount = Math.ceil(totalCount / pageSize);

  return {
    pagination: {
      page,
      pageSize,
      pageCount,
      total: totalCount,
      hasNextPage: page < pageCount,
      hasPrevPage: page > 1
    },
    start: (page - 1) * pageSize,
    limit: pageSize
  };
};
