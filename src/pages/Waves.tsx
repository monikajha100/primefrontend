import React from "react";

interface CornerWavesProps {
  width?: number;
  height?: number;
  primaryColor?: string;
  accentColor?: string;
}

const CornerWaves: React.FC<CornerWavesProps> = ({
  width = 250,
  height = 270,
  primaryColor = "#f7b731",
  accentColor = "rgba(255,255,255,0.5)",
}) => {
  return (
    <>
      <svg
        width={300}
        height={300}
        viewBox="0 0 300 300"
        style={{
          position: "absolute",
          top: -10,
          right: -1,
          zIndex: 1,
        }}
      >
        <path d="M0,0 C150,100 300,0 300,150 L300,0 L0,0 Z" fill={primaryColor} />
      </svg>

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          position: "absolute",
          bottom: 0,
          left: -50,
          zIndex: 1,
        }}
      >
        <path
          d={`M0,${height} C${width * 0.25},${height / 2} ${
            width * 0.75
          },${height / 2} ${width},${height} L${width},${height} L0,${height} Z`}
          fill={accentColor}
        />
      </svg>
    </>
  );
};

export default CornerWaves;
