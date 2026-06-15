"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";

const brandColors = [
  "#00D3FF",
  "#FF0092",
  "#F3F201",
  "#01FFFF",
  "#FF00FE",
  "#FE4600",
];

const STAGE_WIDTH = 1920;
const STAGE_HEIGHT = 1536;
const STAGE_RATIO = STAGE_WIDTH / STAGE_HEIGHT;
const menuBackgroundImage = "/Seleccion.png";
const logoImage = "/LOGO.png";
const finalizeButtonImage = "/Bot%C3%B3n_Finalizar.png";
const downloadButtonImage = "/Bot%C3%B3n_Descargar.png";
const redesignButtonImage = "/Bot%C3%B3n_NuevoDise%C3%B1o.png";
const feelElectricImage = "/Feel_Electric.png";
const wonderfulImage = "/Wonderfull.png";
const nextButtonImage = "/Btn_sig.png";
const farewellDesign1Image = "/Despedida_01.png";
const farewellImage = "/Despedida.png";
const designScreens = {
  design1: {
    templateImage: "/CAR_01.png",
    footerImage: wonderfulImage,
    carLayout: {
      left: 120,
      top: 560,
      width: 1680,
    },
    carCrop: {
      frameAspectRatio: 2021 / 747,
      imageWidthPercent: (2500 / 2021) * 100,
      offsetLeftPercent: -(156 / 2021) * 100,
      offsetTopPercent: -(373 / 747) * 100,
    },
  },
  design2: {
    templateImage: "/02PalaceBeige.png",
    footerImage: feelElectricImage,
    carLayout: {
      left: 160,
      top: 570,
      width: 1700,
    },
    carCrop: {
      frameAspectRatio: 5530 / 2223,
      imageWidthPercent: (7680 / 5530) * 100,
      offsetLeftPercent: -(1177 / 5530) * 100,
      offsetTopPercent: -(1316 / 2223) * 100,
    },
  },
};


const edgeBars = {
  left: "9%",
  bottom: "25%",
  top: "40%",
  right: "6.5%",
};

export default function App() {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const nextTimeoutRef = useRef(null);
  const nextIntervalRef = useRef(null);
  const previousTimeoutRef = useRef(null);
  const previousIntervalRef = useRef(null);
  const finalizeTimeoutRef = useRef(null);
  const finalizeIntervalRef = useRef(null);
  const redesignTimeoutRef = useRef(null);
  const redesignIntervalRef = useRef(null);
  const downloadTimeoutRef = useRef(null);
  const downloadIntervalRef = useRef(null);

  const [color, setColor] = useState("#00D3FF");
  const [lineWidth, setLineWidth] = useState(24);
  const [type, setType] = useState("pen");
  const [screen, setScreen] = useState("design1");
  const [nextProgress, setNextProgress] = useState(0);
  const [previousProgress, setPreviousProgress] = useState(0);
  const [finalizeProgress, setFinalizeProgress] = useState(0);
  const [redesignProgress, setRedesignProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [resultImageUrl, setResultImageUrl] = useState("");
  const [resultFileName, setResultFileName] = useState("");
  const [resultImageBlob, setResultImageBlob] = useState(null);
  const [sharedImageUrl, setSharedImageUrl] = useState("");
  const [qrCodeImageUrl, setQrCodeImageUrl] = useState("");
  const [isUploadingResult, setIsUploadingResult] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const currentDesign = designScreens[screen] ?? designScreens.design2;
  const isResultScreen = screen === "result1" || screen === "result2";
  const isUploadScreen = screen === "uploading1" || screen === "uploading2";
  const isFarewellScreen = screen === "farewell" || screen === "farewell1";
  const currentFarewellImage =
    screen === "farewell1" ? farewellDesign1Image : farewellImage;

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function resetShareState() {
    setSharedImageUrl("");
    setQrCodeImageUrl("");
    setUploadError("");
    setIsUploadingResult(false);
  }

  async function exportDesign(designKey) {
    const design = designScreens[designKey];
    const paintingCanvas = canvasRef.current;

    if (!design || !paintingCanvas) {
      return;
    }

    const [templateImage, logoOverlayImage, footerOverlayImage] =
      await Promise.all([
      loadImage(design.templateImage),
      loadImage(logoImage),
      loadImage(design.footerImage),
    ]);

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = STAGE_WIDTH;
    exportCanvas.height = STAGE_HEIGHT;

    const ctx = exportCanvas.getContext("2d");
    ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    const carWidth = design.carLayout.width;
    const carHeight = carWidth / design.carCrop.frameAspectRatio;
    const imageWidth = (design.carCrop.imageWidthPercent / 100) * carWidth;
    const imageHeight = templateImage.height * (imageWidth / templateImage.width);
    const imageLeft =
      design.carLayout.left +
      (design.carCrop.offsetLeftPercent / 100) * carWidth;
    const imageTop =
      design.carLayout.top +
      (design.carCrop.offsetTopPercent / 100) * carHeight;

    ctx.drawImage(
      paintingCanvas,
      design.carLayout.left,
      design.carLayout.top,
      carWidth,
      carHeight,
      design.carLayout.left,
      design.carLayout.top,
      carWidth,
      carHeight,
    );
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, STAGE_WIDTH * (parseFloat(edgeBars.left) / 100), STAGE_HEIGHT);
    ctx.fillRect(0, STAGE_HEIGHT * (1 - parseFloat(edgeBars.bottom) / 100), STAGE_WIDTH, STAGE_HEIGHT * (parseFloat(edgeBars.bottom) / 100));
    ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT * (parseFloat(edgeBars.top) / 100));
    ctx.fillRect(STAGE_WIDTH * (1 - parseFloat(edgeBars.right) / 100), 0, STAGE_WIDTH * (parseFloat(edgeBars.right) / 100), STAGE_HEIGHT);
    ctx.drawImage(templateImage, imageLeft, imageTop, imageWidth, imageHeight);
    ctx.drawImage(
      logoOverlayImage,
      STAGE_WIDTH * 0.29,
      STAGE_HEIGHT * 0.058,
      STAGE_WIDTH * 0.42,
      logoOverlayImage.height * ((STAGE_WIDTH * 0.42) / logoOverlayImage.width),
    );
    ctx.drawImage(
      footerOverlayImage,
      STAGE_WIDTH * 0.25,
      STAGE_HEIGHT * 0.84,
      STAGE_WIDTH * 0.35,
      footerOverlayImage.height *
        ((STAGE_WIDTH * 0.35) / footerOverlayImage.width),
    );

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-");
    const blob = await new Promise((resolve, reject) => {
      exportCanvas.toBlob((value) => {
        if (value) {
          resolve(value);
          return;
        }

        reject(new Error("No se pudo generar el archivo PNG."));
      }, "image/png");
    });

    return {
      fileName: `${designKey}-${timestamp}.png`,
      blob,
      dataUrl: exportCanvas.toDataURL("image/png"),
    };
  }

  async function uploadResultAndPrepareQr(resultScreen) {
    if (!resultImageBlob || !resultFileName) {
      throw new Error("No hay un archivo listo para compartir.");
    }

    const designKey = resultScreen === "result1" ? "design1" : "design2";
    const uploadRef = storageRef(storage, `Link&Co/${resultFileName}`);

    setIsUploadingResult(true);
    setUploadError("");
    setSharedImageUrl("");
    setQrCodeImageUrl("");

    try {
      await uploadBytes(uploadRef, resultImageBlob, {
        contentType: "image/png",
        customMetadata: {
          design: designKey,
          source: "laser-graffiti",
        },
      });

      const downloadUrl = await getDownloadURL(uploadRef);
      const qrDataUrl = await QRCode.toDataURL(downloadUrl, {
        width: 420,
        margin: 1,
        color: {
          dark: "#231F20",
          light: "#FFFFFF",
        },
      });

      setSharedImageUrl(downloadUrl);
      setQrCodeImageUrl(qrDataUrl);
      setScreen(resultScreen === "result1" ? "farewell1" : "farewell");
    } catch (error) {
      setScreen(resultScreen);
      setUploadError(
        "No se pudo subir el diseno a Firebase. Revisa las reglas del bucket e intentalo otra vez.",
      );
      throw error;
    } finally {
      setIsUploadingResult(false);
    }
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function getCanvasPoint(e) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    let clientX;
    let clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function startStroke(x, y) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
  }

  function stopDrawing() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    ctx.closePath();
    isDrawingRef.current = false;
  }

  function draw(e) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const { x, y } = getCanvasPoint(e);
    const ctx = canvas.getContext("2d");

    if (!isDrawingRef.current) {
      startStroke(x, y);
    }

    if (type === "spray") {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8;

      for (let i = 0; i < 42; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * lineWidth;
        const sprayX = x + radius * Math.cos(angle);
        const sprayY = y + radius * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(sprayX, sprayY, 1.4, 0, 2 * Math.PI);
        ctx.fill();
      }
      return;
    }

    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  useEffect(() => {
    clearCanvas();
  }, []);

  useEffect(() => {
    const farewellImages = [farewellImage, farewellDesign1Image];
    farewellImages.forEach((src) => {
      const image = new Image();
      image.src = src;
    });

    return () => {
      if (nextTimeoutRef.current) {
        clearTimeout(nextTimeoutRef.current);
      }
      if (nextIntervalRef.current) {
        clearInterval(nextIntervalRef.current);
      }
      if (previousTimeoutRef.current) {
        clearTimeout(previousTimeoutRef.current);
      }
      if (previousIntervalRef.current) {
        clearInterval(previousIntervalRef.current);
      }
      if (finalizeTimeoutRef.current) {
        clearTimeout(finalizeTimeoutRef.current);
      }
      if (finalizeIntervalRef.current) {
        clearInterval(finalizeIntervalRef.current);
      }
      if (redesignTimeoutRef.current) {
        clearTimeout(redesignTimeoutRef.current);
      }
      if (redesignIntervalRef.current) {
        clearInterval(redesignIntervalRef.current);
      }
      if (downloadTimeoutRef.current) {
        clearTimeout(downloadTimeoutRef.current);
      }
      if (downloadIntervalRef.current) {
        clearInterval(downloadIntervalRef.current);
      }
    };
  }, []);

  function startFinalizeHover() {
    if (
      (screen !== "design1" && screen !== "design2") ||
      finalizeTimeoutRef.current
    ) {
      return;
    }

    const startTime = Date.now();
    setFinalizeProgress(0);

    finalizeIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const nextProgress = Math.min(elapsed / 3000, 1);
      setFinalizeProgress(nextProgress);

      if (nextProgress >= 1) {
        clearInterval(finalizeIntervalRef.current);
        finalizeIntervalRef.current = null;
      }
    }, 16);

    finalizeTimeoutRef.current = setTimeout(async () => {
      try {
        const exportedDesign = await exportDesign(screen);
        resetShareState();
        setResultImageUrl(exportedDesign.dataUrl);
        setResultImageBlob(exportedDesign.blob);
        setResultFileName(exportedDesign.fileName);
        setScreen(screen === "design1" ? "result1" : "result2");
      } catch (error) {
        console.error(error);
      }
      setFinalizeProgress(0);
      stopDrawing();
      cancelRedesignHover();
      finalizeTimeoutRef.current = null;
    }, 3000);
  }

  function cancelFinalizeHover() {
    if (finalizeTimeoutRef.current) {
      clearTimeout(finalizeTimeoutRef.current);
      finalizeTimeoutRef.current = null;
    }
    if (finalizeIntervalRef.current) {
      clearInterval(finalizeIntervalRef.current);
      finalizeIntervalRef.current = null;
    }
    setFinalizeProgress(0);
  }

  function startRedesignHover() {
    if (!isFarewellScreen || redesignTimeoutRef.current) {
      return;
    }

    const startTime = Date.now();
    setRedesignProgress(0);

    redesignIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const nextProgress = Math.min(elapsed / 3000, 1);
      setRedesignProgress(nextProgress);

      if (nextProgress >= 1) {
        clearInterval(redesignIntervalRef.current);
        redesignIntervalRef.current = null;
      }
    }, 16);

    redesignTimeoutRef.current = setTimeout(() => {
      setScreen("design1");
      setRedesignProgress(0);
      setResultImageUrl("");
      setResultFileName("");
      setResultImageBlob(null);
      resetShareState();
      clearCanvas();
      cancelFinalizeHover();
      redesignTimeoutRef.current = null;
    }, 3000);
  }

  function cancelRedesignHover() {
    if (redesignTimeoutRef.current) {
      clearTimeout(redesignTimeoutRef.current);
      redesignTimeoutRef.current = null;
    }
    if (redesignIntervalRef.current) {
      clearInterval(redesignIntervalRef.current);
      redesignIntervalRef.current = null;
    }
    setRedesignProgress(0);
  }

  function startDownloadHover() {
    if (!isResultScreen || downloadTimeoutRef.current || isUploadingResult) {
      return;
    }

    const startTime = Date.now();
    setDownloadProgress(0);

    downloadIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / 3000, 1);
      setDownloadProgress(progress);

      if (progress >= 1) {
        clearInterval(downloadIntervalRef.current);
        downloadIntervalRef.current = null;
      }
    }, 16);

    downloadTimeoutRef.current = setTimeout(async () => {
      const activeResultScreen = screen;
      const uploadScreen =
        activeResultScreen === "result1" ? "uploading1" : "uploading2";
      setDownloadProgress(0);
      downloadTimeoutRef.current = null;
      setScreen(uploadScreen);

      try {
        await uploadResultAndPrepareQr(activeResultScreen);
      } catch (error) {
        console.error(error);
      }
    }, 3000);
  }

  function cancelDownloadHover() {
    if (downloadTimeoutRef.current) {
      clearTimeout(downloadTimeoutRef.current);
      downloadTimeoutRef.current = null;
    }
    if (downloadIntervalRef.current) {
      clearInterval(downloadIntervalRef.current);
      downloadIntervalRef.current = null;
    }
    setDownloadProgress(0);
  }

  function startNextHover() {
    if (screen !== "design1" || nextTimeoutRef.current) {
      return;
    }

    const startTime = Date.now();
    setNextProgress(0);

    nextIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / 3000, 1);
      setNextProgress(progress);

      if (progress >= 1) {
        clearInterval(nextIntervalRef.current);
        nextIntervalRef.current = null;
      }
    }, 16);

    nextTimeoutRef.current = setTimeout(() => {
      goToNextDesign();
      setNextProgress(0);
      nextTimeoutRef.current = null;
    }, 3000);
  }

  function cancelNextHover() {
    if (nextTimeoutRef.current) {
      clearTimeout(nextTimeoutRef.current);
      nextTimeoutRef.current = null;
    }
    if (nextIntervalRef.current) {
      clearInterval(nextIntervalRef.current);
      nextIntervalRef.current = null;
    }
    setNextProgress(0);
  }

  function startPreviousHover() {
    if (screen !== "design2" || previousTimeoutRef.current) {
      return;
    }

    const startTime = Date.now();
    setPreviousProgress(0);

    previousIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / 3000, 1);
      setPreviousProgress(progress);

      if (progress >= 1) {
        clearInterval(previousIntervalRef.current);
        previousIntervalRef.current = null;
      }
    }, 16);

    previousTimeoutRef.current = setTimeout(() => {
      goToPreviousDesign();
      setPreviousProgress(0);
      previousTimeoutRef.current = null;
    }, 3000);
  }

  function cancelPreviousHover() {
    if (previousTimeoutRef.current) {
      clearTimeout(previousTimeoutRef.current);
      previousTimeoutRef.current = null;
    }
    if (previousIntervalRef.current) {
      clearInterval(previousIntervalRef.current);
      previousIntervalRef.current = null;
    }
    setPreviousProgress(0);
  }

  function goToNextDesign() {
    if (screen !== "design1") {
      return;
    }

    cancelNextHover();
    cancelFinalizeHover();
    setScreen("design2");
    clearCanvas();
    stopDrawing();
  }

  function goToPreviousDesign() {
    if (screen !== "design2") {
      return;
    }

    cancelPreviousHover();
    setScreen("design1");
    clearCanvas();
    stopDrawing();
    cancelFinalizeHover();
  }

  useEffect(() => {
    setFinalizeProgress(0);

    if (screen === "design1") {
      cancelPreviousHover();
      cancelRedesignHover();
      cancelDownloadHover();
    }

    if (screen === "design2") {
      cancelNextHover();
      cancelRedesignHover();
      cancelDownloadHover();
    }

    if (isResultScreen) {
      cancelNextHover();
      cancelPreviousHover();
      cancelFinalizeHover();
    }

    if (isFarewellScreen) {
      cancelNextHover();
      cancelPreviousHover();
      cancelFinalizeHover();
      cancelDownloadHover();
    }
    if (isUploadScreen) {
      cancelNextHover();
      cancelPreviousHover();
      cancelFinalizeHover();
      cancelDownloadHover();
    }
  }, [screen, isFarewellScreen, isResultScreen, isUploadScreen]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#2b2b2b] flex items-center justify-center">
        <div
          className="relative overflow-hidden bg-[#E1E1E1]"
          style={{
            width: `min(100vw, calc(100vh * ${STAGE_RATIO}))`,
            height: `min(100vh, calc(100vw / ${STAGE_RATIO}))`,
            aspectRatio: `${STAGE_WIDTH} / ${STAGE_HEIGHT}`,
          }}
        >
        <img
          src={logoImage}
          alt="Logo"
          className={`absolute z-40 pointer-events-none object-contain transition-opacity duration-300 ${
            isFarewellScreen || isResultScreen ? "opacity-0" : "opacity-100"
          }`}
          style={{
            width: "42%",
            left: "29%",
            top: "5.8%",
          }}
        />

        <div
          className={`absolute z-50 transition-opacity duration-300 ${
            isFarewellScreen || isResultScreen ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{
            left: "5.8%",
            top: "5.8%",
            width: "15%",
            aspectRatio: "1124 / 1923",
            backgroundImage: `url(${menuBackgroundImage})`,
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
          }}
          onMouseEnter={stopDrawing}
          onMouseLeave={stopDrawing}
        >
          <div className="relative h-full w-full">
            <div
              className="absolute left-1/2 -translate-x-1/2 grid grid-cols-3 justify-items-center"
              style={{
                top: "18%",
                width: "74%",
                rowGap: "11%",
                columnGap: "8%",
              }}
            >
              {brandColors.map((brandColor, index) => (
                <button
                  key={index}
                  className={`rounded-full cursor-none ${
                    brandColor === color
                      ? "border-[4px] border-[#336AEA]"
                      : "border-[2px] border-transparent"
                  }`}
                  style={{
                    backgroundColor: brandColor,
                    width: "78%",
                    aspectRatio: "1 / 1",
                  }}
                  onMouseEnter={() => {
                    setColor(brandColor);
                  }}
                />
              ))}
            </div>

            <div
              className="absolute left-1/2 -translate-x-1/2 flex items-center justify-between"
              style={{
                top: "52.8%",
                width: "70%",
              }}
            >
              {[24, 36, 52].map((size) => (
                <button
                  key={size}
                  className={`rounded-full bg-[#4A4A4A] cursor-none ${
                    lineWidth === size
                      ? "border-[4px] border-[#336AEA]"
                      : "border-[2px] border-transparent"
                  }`}
                  style={{
                    width: size === 24 ? "15%" : size === 36 ? "22%" : "29%",
                    aspectRatio: "1 / 1",
                  }}
                  onMouseEnter={() => {
                    setLineWidth(size);
                  }}
                />
              ))}
            </div>

            <div
              className="absolute left-1/2 -translate-x-1/2 flex justify-between"
              style={{
                top: "80.5%",
                width: "60%",
              }}
            >
              <button
                className={`rounded-full cursor-none flex items-center justify-center bg-[#4A4A4A] ${
                  type === "pen"
                    ? "border-[4px] border-[#336AEA]"
                    : "border-[2px] border-transparent"
                }`}
                style={{
                  width: "42%",
                  aspectRatio: "1 / 1",
                }}
                onMouseEnter={() => {
                  setType("pen");
                }}
              >
                <img src="/pincel.svg" alt="" className="w-[52%]" />
              </button>
              <button
                className={`rounded-full cursor-none flex items-center justify-center bg-[#4A4A4A] ${
                  type === "spray"
                    ? "border-[4px] border-[#336AEA]"
                    : "border-[2px] border-transparent"
                }`}
                style={{
                  width: "42%",
                  aspectRatio: "1 / 1",
                }}
                onMouseEnter={() => {
                  setType("spray");
                }}
              >
                <img src="/spray.svg" alt="" className="w-[46%]" />
              </button>
            </div>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={STAGE_WIDTH}
          height={STAGE_HEIGHT}
          className={`absolute inset-0 z-10 h-full w-full transition-opacity duration-300 ${
            isFarewellScreen || isResultScreen ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          onMouseMove={draw}
          onMouseLeave={stopDrawing}
          onMouseUp={stopDrawing}
        />

        <div
          className="absolute z-20 pointer-events-none bg-white"
          style={{
            left: 0,
            top: 0,
            width: edgeBars.left,
            height: "100%",
          }}
        />

        <div
          className="absolute z-20 pointer-events-none bg-white"
          style={{
            left: 0,
            bottom: 0,
            width: "100%",
            height: edgeBars.bottom,
          }}
        />

        <div
          className="absolute z-20 pointer-events-none bg-white"
          style={{
            left: 0,
            top: 0,
            width: "100%",
            height: edgeBars.top,
          }}
        />

        <div
          className="absolute z-20 pointer-events-none bg-white"
          style={{
            right: 0,
            top: 0,
            width: edgeBars.right,
            height: "100%",
          }}
        />

        <div
          className={`absolute z-30 pointer-events-none overflow-hidden transition-opacity duration-300 ${
            isFarewellScreen || isResultScreen ? "opacity-0" : "opacity-100"
          }`}
          style={{
            width: `${(currentDesign.carLayout.width / STAGE_WIDTH) * 100}%`,
            left: `${(currentDesign.carLayout.left / STAGE_WIDTH) * 100}%`,
            top: `${(currentDesign.carLayout.top / STAGE_HEIGHT) * 100}%`,
            aspectRatio: `${currentDesign.carCrop.frameAspectRatio}`,
          }}
        >
          <img
            src={currentDesign.templateImage}
            alt=""
            className="absolute max-w-none pointer-events-none"
            style={{
              width: `${currentDesign.carCrop.imageWidthPercent}%`,
              left: `${currentDesign.carCrop.offsetLeftPercent}%`,
              top: `${currentDesign.carCrop.offsetTopPercent}%`,
            }}
          />
        </div>

        <img
          src={currentDesign.footerImage}
          alt=""
          className={`absolute z-40 pointer-events-none object-contain transition-opacity duration-300 ${
            isFarewellScreen || isResultScreen ? "opacity-0" : "opacity-100"
          }`}
          style={{
            width: "35%",
            left: "25%",
            bottom: "6.1%",
          }}
        />

        <div
          className={`absolute z-40 transition-opacity duration-300 ${
            screen === "design1" ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          style={{
            width: "7.5%",
            right: "6.2%",
            top: "6.2%",
            aspectRatio: "1 / 1",
          }}
          onMouseEnter={startNextHover}
          onMouseLeave={cancelNextHover}
        >
          <div className="absolute inset-x-[18%] bottom-[8%] h-[8%] overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-75"
              style={{ width: `${nextProgress * 100}%` }}
            />
          </div>
          <img
            src={nextButtonImage}
            alt="Siguiente"
            className="pointer-events-none object-contain w-full h-full"
          />
        </div>

        <div
          className={`absolute z-40 transition-opacity duration-300 ${
            screen === "design1" ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          style={{
            width: "21.5%",
            right: "6.2%",
            bottom: "6.8%",
          }}
          onMouseEnter={startFinalizeHover}
          onMouseLeave={cancelFinalizeHover}
        >
          <div className="absolute inset-x-[9%] bottom-[8%] h-[8%] overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-75"
              style={{ width: `${finalizeProgress * 100}%` }}
            />
          </div>
          <img
            src={finalizeButtonImage}
            alt="Finalizar"
            className="pointer-events-none object-contain w-full"
          />
        </div>

        <div
          className={`absolute z-40 transition-opacity duration-300 ${
            screen === "design2" ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          style={{
            width: "7.5%",
            right: "6.2%",
            top: "6.2%",
            aspectRatio: "1 / 1",
            transform: "scaleX(-1)",
          }}
          onMouseEnter={startPreviousHover}
          onMouseLeave={cancelPreviousHover}
        >
          <div className="absolute inset-x-[18%] bottom-[8%] h-[8%] overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-75"
              style={{ width: `${previousProgress * 100}%` }}
            />
          </div>
          <img
            src={nextButtonImage}
            alt="Anterior"
            className="pointer-events-none object-contain w-full h-full"
          />
        </div>

        <div
          className={`absolute z-40 transition-opacity duration-300 ${
            screen === "design2" ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          style={{
            width: "21.5%",
            right: "6.2%",
            bottom: "6.8%",
          }}
          onMouseEnter={startFinalizeHover}
          onMouseLeave={cancelFinalizeHover}
        >
          <div className="absolute inset-x-[9%] bottom-[8%] h-[8%] overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-75"
              style={{ width: `${finalizeProgress * 100}%` }}
            />
          </div>
          <img
            src={finalizeButtonImage}
            alt="Finalizar"
            className="pointer-events-none object-contain w-full"
          />
        </div>

        <div
          className={`absolute inset-0 z-[55] transition-opacity duration-300 ${
            isResultScreen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="absolute inset-0 bg-white" />
          {resultImageUrl ? (
            <img
              src={resultImageUrl}
              alt="Resultado"
              className="absolute inset-0 h-full w-full object-contain"
            />
          ) : null}

          {uploadError ? (
            <div className="absolute left-1/2 top-[8%] z-10 w-[50%] -translate-x-1/2 rounded-[24px] bg-[#231F20]/92 px-[2.4%] py-[1.8%] text-center text-white shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
              <p className="font-semibold" style={{ fontSize: "1.15vw" }}>
                {uploadError}
              </p>
            </div>
          ) : null}

          <div
            className="absolute"
            style={{
              width: "24%",
              right: "6.2%",
              bottom: "6.8%",
              aspectRatio: "3.2 / 1",
            }}
            onMouseEnter={startDownloadHover}
            onMouseLeave={cancelDownloadHover}
          >
            <div className="absolute inset-x-[9%] bottom-[10%] h-[8%] overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-[width] duration-75"
                style={{ width: `${downloadProgress * 100}%` }}
              />
            </div>
            <img
              src={downloadButtonImage}
              alt="Descargar"
              className="pointer-events-none object-contain w-full h-full"
            />
          </div>
        </div>

        <div
          className={`absolute inset-0 z-[58] transition-opacity duration-300 ${
            isUploadScreen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="absolute inset-0 bg-white" />

          <img
            src={logoImage}
            alt="Logo"
            className="absolute object-contain"
            style={{
              width: "34%",
              left: "33%",
              top: "7.2%",
            }}
          />

          <div
            className="absolute left-1/2 top-1/2 w-[40%] -translate-x-1/2 -translate-y-1/2 rounded-[34px] bg-white px-[3.8%] py-[3.2%] text-center shadow-[0_32px_90px_rgba(0,0,0,0.12)]"
            style={{
              border: "1px solid rgba(35, 31, 32, 0.06)",
            }}
          >
            <div className="mx-auto h-[16px] w-[62%] overflow-hidden rounded-full bg-black/10">
              <div className="h-full w-full animate-pulse rounded-full bg-[#231F20]" />
            </div>
            <p
              className="mt-[6%] font-black uppercase tracking-[0.08em] text-[#231F20]"
              style={{ fontSize: "2.35vw", lineHeight: 1.05 }}
            >
              Subiendo tu
              <br />
              diseno
            </p>
            <p
              className="mt-[3%] font-medium text-[#4A4A4A]"
              style={{ fontSize: "1.08vw", lineHeight: 1.45 }}
            >
              Estamos guardando el PNG en Firebase
              <br />
              y creando tu QR de descarga.
            </p>
          </div>
        </div>

        <div
          className={`absolute inset-0 z-[60] transition-opacity duration-300 ${
            isFarewellScreen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <img
            src={currentFarewellImage}
            alt="Despedida"
            className="absolute inset-0 h-full w-full object-contain"
          />

          {qrCodeImageUrl ? (
            <div
              className="absolute flex items-center justify-center rounded-[28px] bg-white p-[1.3%] shadow-[0_30px_70px_rgba(0,0,0,0.16)]"
              style={{
                width: "19.4%",
                left: "50%",
                top: "48%",
                transform: "translate(-50%, -50%)",
                aspectRatio: "1 / 1",
              }}
            >
              <img
                src={qrCodeImageUrl}
                alt="QR para descargar el diseno"
                className="h-full w-full object-contain"
              />
            </div>
          ) : null}

          {sharedImageUrl ? (
            <p
              className="absolute text-center font-semibold text-[#231F20]"
              style={{
                width: "22%",
                left: "50%",
                top: "64%",
                transform: "translateX(-50%)",
                fontSize: "0.95vw",
                lineHeight: 1.3,
              }}
            >
              Escanea para abrir tu archivo en el celular.
            </p>
          ) : null}

          <div
            className="absolute"
            style={{
              width: "27%",
              left: "50%",
              transform: "translateX(-50%)",
              bottom: "6.8%",
              aspectRatio: "3.2 / 1",
            }}
            onMouseEnter={startRedesignHover}
            onMouseLeave={cancelRedesignHover}
          >
            <div className="absolute inset-x-[9%] bottom-[14%] h-[8%] overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-[width] duration-75"
                style={{ width: `${redesignProgress * 100}%` }}
              />
            </div>
            <img
              src={redesignButtonImage}
              alt="Nuevo diseno"
              className="pointer-events-none object-contain w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

