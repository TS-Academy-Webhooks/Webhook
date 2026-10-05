function sendSuccess(res, message, data = null, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function sendError(res, message, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
}

function paginatedData(items, page, limit, totalItems, resourceName) {
  const pagination = {
    page,
    limit,
    total: totalItems,
    totalItems,
    totalPages: Math.ceil(totalItems / limit) || 1,
  };
  const data = { items, pagination };
  if (resourceName) {
    data[resourceName] = items;
  }
  return data;
}

module.exports = { paginatedData, sendSuccess, sendError };