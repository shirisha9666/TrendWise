const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();

  res.status(statusCode).cookie("token", token).json({
    success: true,
    userId: user._id,
    name: user?.name,
    eamil: user?.email,
token,
  });
};

export default sendToken;
