import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import { loadExternalBubbleInteraction } from "@tsparticles/interaction-external-bubble";

const BackgroundParticles = () => {
  const particlesInit = useCallback(async (engine) => {
    // Charge toutes les fonctionnalités
    await loadFull(engine);
    // Charge le mode 'bubble' pour les interactions
    await loadExternalBubbleInteraction(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        fullScreen: { enable: true, zIndex: 0 },
        background: {
          color: {
            value: "#030014"
          }
        },
        fpsLimit: 60,
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "grab"
            },
            resize: true
          },
          modes: {
            grab: {
              distance: 140,
              links: {
                opacity: 0.5
              }
            }
          }
        },
        particles: {
          color: {
            value: "#a855f7"
          },
          links: {
            color: "#6366f1",
            distance: 150,
            enable: true,
            opacity: 0.3,
            width: 1
          },
          move: {
            enable: true,
            speed: 1.5,
            direction: "none",
            outModes: {
              default: "bounce"
            }
          },
          number: {
            value: 60,
            density: {
              enable: true,
              area: 800
            }
          },
          opacity: {
            value: 0.3
          },
          shape: {
            type: "circle"
          },
          size: {
            value: { min: 1, max: 3 }
          }
        },
        detectRetina: true
      }}
    />
  );
};

export default BackgroundParticles;
