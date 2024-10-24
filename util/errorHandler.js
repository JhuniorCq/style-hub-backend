const errorHandler = (err, req, res, next) => {
  res
    .status(err.statusCode ?? 500)
    .json({ message: err.message ?? "Error interno del servidor." });
};

export { errorHandler };