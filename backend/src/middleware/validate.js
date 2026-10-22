function validate(schemaFn) {
  return (req, res, next) => {
    const errors = schemaFn(req);
    if (errors && errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }
    next();
  };
}

module.exports = validate;
