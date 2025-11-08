import React from 'react';
import { motion } from 'motion/react';
import '../styles/EtapesList.css';

interface Etapa {
  id: number;
  titol: string;
  descripcio: string;
  ubicacio: string;
}

interface EtapesListProps {
  etapes: Etapa[];
}

const EtapesList: React.FC<EtapesListProps> = ({ etapes }) => {
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
            <p className="etapa-descripcio">{etapa.descripcio}</p>
            <div className="etapa-ubicacio">
              <img src="/images/ubi.png" alt="Ubicació" className="etapa-ubi-icon" />
              <span>{etapa.ubicacio}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default EtapesList;
