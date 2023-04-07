import {useEffect, useState} from "react"
import {Box, Dialog, DialogContent, DialogContentText, DialogTitle, Grid, Stack, Typography} from "@mui/material"
import Typewriter from "typewriter-effect"

export default function HeroCenter({
                                     decorative = "",
                                     title = "Modulizar, Customizable zkEVM Rollup As A Service👋🏽",
                                     subtitle = "Bring up your own zk rollup without the hassle of managing the infrastructure.",
                                   }: {
  decorative?: React.ReactNode
  title?: React.ReactNode
  subtitle?: React.ReactNode
}) {

  const [openEarlyAccess, setOpenEarlyAccess] = useState(false);
  const [thankyouDialog, setThankyouDialog] = useState(false);

  const handleClickOpen = () => {
    setOpenEarlyAccess(true);
    setThankyouDialog(false);
  };
  const handleCloseSuccess = () => {
    setOpenEarlyAccess(false);
    setThankyouDialog(true)
  };

  const handleCloseCancel = () => {
    setOpenEarlyAccess(false);
    setThankyouDialog(false)
  };

  useEffect(() => {
    setTimeout(() => {
      setThankyouDialog(false);
    }, 2000);
  }, [thankyouDialog]);

  return (
      <Box sx={{
        // minHeight: "100vh",
      }}>
        <Box
          sx={{
            // top: "30%",
            // position: "absolute",
            opacity: 1,
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            gap: 2,
            my: 6,
            // minHeight: "100vh",
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              color: "primary.500",
              fontWeight: 600,
              fontSize: "sm",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {decorative}
          </Box>

          {/*<Grid container={true} spacing={2}>*/}
          {/*  <Grid item xs={6}>*/}
          {/*    <Box w="200px" h="200px" sx={{*/}
          {/*      display: "flex",*/}
          {/*      alignItems: "center",*/}
          {/*    }}>*/}
          {/*      <Lottie animationData={rollup}/>*/}
          {/*    </Box>*/}
          {/*  </Grid>*/}

          {/*<Grid item xs={6} alignItems={"center"}>*/}
            {/*<Box w="200px" h="200px">*/}
            {/*<Box sx={{width: "200px", height: "200px"}}>*/}
              {/*<Lottie animationData={rollup}/>*/}
            {/*</Box>*/}
          {/*</Grid>*/}
          {/*</Grid>*/}


          <Box>
            <Typography
              variant="h2"
              sx={{
                fontSize: {xs: "4xl", sm: "5xl", md: "6xl"},
                fontWeight: 800,
              }}
            >
              {title}
            </Typography>
          </Box>

          <Grid sx={{mt: 2}}>
            {/*<Box mt={10} sx={{textAlign="center" color="#9155FD" fontWeight="900" as="h1"*/}
            {/*         fontSize={{base: "6xl", md: "8xl"}}}}>*/}

            <Box sx={{
              color: "#80868b",
              fontWeight: 900,
              fontSize: "24px",
            }}>

              <Typewriter options={{loop: true}}
                          onInit={(typewriter) => {
                            typewriter
                              .changeDelay(50)
                              .typeString('Build your own zk rollup in minutes 🔥')
                              .callFunction(() => {
                                // console.log('String typed out!');
                              })
                              .pauseFor(1000)
                              // .deleteAll(10)
                              .callFunction(() => {
                                // console.log('All strings were deleted');
                              })
                              .typeString('without the hassle of managing the infrastructure')
                              .pauseFor(3000)
                              .deleteAll(10)
                              .start();
                          }}
              />
            </Box>
          </Grid>

          <Grid>
            {/*<Button*/}
            {/*  onClick={handleClickOpen}*/}
            {/*  color={'primary'} variant='contained' sx={{px: 5.5, mt: 3}}>*/}
            {/*  Apply For Early Access*/}
            {/*</Button>*/}
          </Grid>

          <Dialog open={thankyouDialog}>
            {thankyouDialog && (
              <>
                <DialogTitle>Thank you!</DialogTitle>
                <DialogContent>
                  <Stack spacing={3}>
                    <DialogContentText>
                      <Typography variant="body2" component="span">
                        We will let you know when we are ready to launch.
                      </Typography>
                    </DialogContentText>
                  </Stack>
                </DialogContent>
              </>
            )}
          </Dialog>


          <Dialog open={openEarlyAccess}>
            {openEarlyAccess && (
              <>
                <DialogTitle>Early Access</DialogTitle>
                <DialogContent>
                  <Stack spacing={3}>
                    <DialogContentText>
                      <Typography variant="body2" component="span">
                        We will start rolling out the service in the next few weeks. If you are interested in early
                        access, please fill out the form below.
                      </Typography>
                    </DialogContentText>

                    {/*<ApplyEarlyAccessForm onSubmit={handleCloseSuccess} onCancel={handleCloseCancel}/>*/}
                  </Stack>
                </DialogContent>
              </>
            )}
          </Dialog>
        </Box>
      </Box>
  )
}
