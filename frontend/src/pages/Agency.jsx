import { useParams } from "react-router-dom";
import { useState } from "react";
import { Box, Switch, FormControlLabel } from "@mui/material";
import { TreeView, TreeItem } from "@mui/lab";
import { useCategories, useSuppliersByCat } from "../api/queries";

export default function Agency() {
  const { id } = useParams();
  const agencyId = Number(id);
  const [type, setType] = useState("material");
  const { data: cats = [] } = useCategories(agencyId, type);

  return (
    <Box sx={{ p: 2 }}>
      <FormControlLabel
        control={
          <Switch
            checked={type === "service"}
            onChange={() =>
              setType(prev => (prev === "material" ? "service" : "material"))
            }
          />
        }
        label={type === "material" ? "Materiale" : "Servicii"}
      />

      <TreeView defaultCollapseIcon="▾" defaultExpandIcon="▸">
        {cats.map(cat => (
          <CatNode key={cat.id} cat={cat} agencyId={agencyId} />
        ))}
      </TreeView>
    </Box>
  );
}

function CatNode({ cat, agencyId }) {
  const { data: supp = [] } = useSuppliersByCat(agencyId, cat.id);
  return (
    <TreeItem nodeId={`cat-${cat.id}`} label={cat.name}>
      {supp.map(s => (
        <TreeItem
          key={s.id}
          nodeId={`sup-${s.id}`}
          label={s.name}
          /* aici vei putea deschide un dialog cu detalii */
        />
      ))}
    </TreeItem>
  );
}
