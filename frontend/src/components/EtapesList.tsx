import React from 'react';
import { motion } from 'motion/react';
import '../styles/EtapesList.css';
import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Etapa {
  id: number;
  titol: string;
  descripcio?: string;
  ubicacio?: string;
  imatge?: string;
}

interface EtapesListProps {
  etapes: Etapa[];
}

const EtapesList: React.FC<EtapesListProps> = ({ etapes }) => {
    const { t } = useTranslation();
  return (
    <div className="etapes-container">
      {etapes.map((etapa, index) => (
        <motion.div
          key={etapa.id}
          className="etapa-card"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <div className="etapa-numero">{etapa.id + 1}</div>
          <div className="etapa-contingut">
            <h3 className="etapa-titol">{etapa.titol}</h3>
            {etapa.descripcio && (
              <p className="etapa-descripcio">{etapa.descripcio}</p>
            )}
            <div className="etapa-ubicacio">
              <MapPin className="etapa-ubi-icon" />

              <span>{etapa.ubicacio || t('route_detail_location_unknown')}</span>
            </div>
          </div>
          
          {etapa.imatge && (
            <img
              src={etapa.imatge}
              alt={etapa.titol}
              className="etapa-imagen"
            />
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default EtapesList;
