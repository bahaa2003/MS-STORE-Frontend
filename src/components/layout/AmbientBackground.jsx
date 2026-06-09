import React from 'react';

const AmbientBackground = () => (
  <div className="ambient-background" aria-hidden="true">
    <div className="ambient-background__veil" />
    <div className="ambient-background__mesh" />
    <div className="ambient-background__glow ambient-background__glow--left" />
    <div className="ambient-background__glow ambient-background__glow--right" />
    <div className="ambient-background__glow ambient-background__glow--bottom" />
  </div>
);

export default AmbientBackground;
