import React, { useState } from "react";
import { useSpring, animated } from "react-spring";
import {
  Paper,
  Button,
  Box,
  LinearProgress,
  Grid,
  TextField as MuiTextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import "./styles.scss";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const LoginSchema = Yup.object().shape({
  newPassword: Yup.string()
    .required("Required")
    .min(8, "Password is too short - should be 8 chars minimum."),
  confirmPassword: Yup.string().oneOf(
    [Yup.ref("newPassword"), null],
    "Passwords must match"
  ),
});

const ResetPassword = () => {
  // state
  const [show, setShow] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  const fade = useSpring({
    from: {
      // opacity: 0,
      transform: "translate3d(0,-100%,0)",
    },
    to: {
      // opacity: 1,
      transform: "translate3d(0,0,0)",
    },
  });

  const handleReset = async (values, setSubmitting) => {
    console.log(values);
    setSubmitting(false);
  };

  return (
    <animated.div style={fade}>
      <Grid container className="authPage">
        <Grid
          item
          xs={12}
          style={{ height: "100vh" }}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Box
            sx={{
              width: {
                xs: "600px",
              },
              marginX: {
                xs: 2,
                md: 0,
              },
            }}
          >
            <Paper className="p-3" elevation={3}>
              <h3 className="text-center authHeading mb-2">Magic Progress</h3>
              <Formik
                initialValues={{
                  newPassword: "",
                  confirmPassword: "",
                }}
                onSubmit={(values, { setSubmitting }) => {
                  handleReset(values, setSubmitting);
                }}
                validationSchema={LoginSchema}
              >
                {({ isSubmitting, handleChange, touched, errors }) => (
                  <Form>
                    <Box margin={1}>
                      <MuiTextField
                        margin="dense"
                        label="New Password"
                        name="newPassword"
                        type={show.newPassword ? "text" : "password"}
                        fullWidth
                        onChange={handleChange}
                        error={touched.newPassword && errors.newPassword}
                        helperText={touched.newPassword && errors.newPassword}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() =>
                                  setShow({
                                    ...show,
                                    newPassword: !show.newPassword,
                                  })
                                }
                              >
                                {show.newPassword ? (
                                  <VisibilityOff />
                                ) : (
                                  <Visibility />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        variant="outlined"
                      />
                    </Box>
                    <Box margin={1}>
                      <MuiTextField
                        margin="dense"
                        label="Confirm Password"
                        name="confirmPassword"
                        type={show.confirmPassword ? "text" : "password"}
                        fullWidth
                        onChange={handleChange}
                        error={
                          touched.confirmPassword && errors.confirmPassword
                        }
                        helperText={
                          touched.confirmPassword && errors.confirmPassword
                        }
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() =>
                                  setShow({
                                    ...show,
                                    confirmPassword: !show.confirmPassword,
                                  })
                                }
                              >
                                {show.confirmPassword ? (
                                  <VisibilityOff />
                                ) : (
                                  <Visibility />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        variant="outlined"
                      />
                    </Box>
                    <Box margin={1}>
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ backgroundColor: "#2f4983" }}
                        disabled={isSubmitting}
                      >
                        Reset Password
                      </Button>
                      {isSubmitting && <LinearProgress className="mt-3" />}
                    </Box>
                  </Form>
                )}
              </Formik>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </animated.div>
  );
};

export default ResetPassword;
