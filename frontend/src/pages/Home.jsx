import { useAgencies } from "../api/queries";
import { useNavigate } from "react-router-dom";
import { Grid, Paper } from "@mui/material";

export default function Home() {
  const { data: agencies = [] } = useAgencies();
  const nav = useNavigate();

  return (
    <Grid container spacing={2} justifyContent="center" sx={{ mt: 4 }}>
      {agencies.map(a => (
        <Grid item key={a.id}>
          <Paper
            sx={{
              width: 200,
              height: 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              p: 2,
            }}
            elevation={3}
            onClick={() => nav(`/agency/${a.id}`)}
          >
            {a.name}
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
