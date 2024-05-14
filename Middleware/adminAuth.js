const isLogin = async (req, res, next) => {
  try {
    if (req.session.Admin) {
      next();
    } else {
      res.redirect("/api/admin");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.Admin) {
      res.redirect("/api/admin/dashboard");
    } else {
      next();
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  isLogin,
  isLogout,
};
