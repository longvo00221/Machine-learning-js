import { useEffect, useRef, useState } from "react";
import "./App.css";
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as knnClassifier from "@tensorflow-models/knn-classifier";
import { Howl } from "howler";
import warningSound from "./assets/warning.mp3";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
var sound = new Howl({
  src: [warningSound],
});

function App() {
  const TRANNING_TIME = 50;
  const UNTOUCH_LABEL = "UNTOUCH_LABEL";
  const TOUCHED_LABEL = "TOUCHED_LABEL";
  const TOUCHED_CONFIDENCE = 0.8;
  const vid = useRef()
  const setupCamera = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        reject(new Error("getUserMedia is not supported"));
        return;
      }

      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          
          vid.current.srcObject = stream;
          resolve(vid);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };
  

  const mobilenetModule = useRef();
  const classifier = useRef();
  const [setUpModule, setSetUpModule] = useState(false);
  const init = async () => {
    await setupCamera();;
    mobilenetModule.current = await mobilenet.load();
    classifier.current = knnClassifier.create();
    setSetUpModule(true);
    toast.success("Hoàn Tất Cài Đặt", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
  };

  useEffect(() => {
    init();
    return () => {};
  }, []);
  const [processBar , setProcessBar] = useState(false)
  const train = async (label) => {
    let processBar = document.querySelector(".process-bar");
    for (let i = 0; i < TRANNING_TIME; i++) {
      const processLoad = parseInt(((i + 1) / TRANNING_TIME) * 100)
      processBar.style.width = `${processLoad}%`;
      processBar.innerHTML =`${processLoad}%`
      if (processBar === 100) {
        setProcessBar(false)
      }else{
        setProcessBar(true)
      }
      console.log(
        `Process Loading : ${processLoad}%`
      );

      await tranning(label);
    }
  };
  const[trainSuccess,setTrainSuccess] = useState(false)
  const tranning = (label) => {
    return new Promise(async (resolve) => {
      const embedding = mobilenetModule.current.infer(vid.current, true);
      classifier.current.addExample(embedding, label);
      await sleep(100);
      setTrainSuccess(true)
      resolve();
    });
  };
  const [touchedAction, setTouchedAction] = useState(false);
 
  
  const handleRun = async () => {
    const embedding = mobilenetModule.current.infer(vid.current, true);
    const result = await classifier.current.predictClass(embedding);
    toast.success("Chương Trình Đang Chạy", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
    if (
      result.confidences.TOUCHED_LABEL === 1 &&
      result.label === TOUCHED_LABEL
    ) {
      setTouchedAction(true);
     
    } else {
      setTouchedAction(false);
     
    }
    await sleep(200);

    
    handleRun();
  };
  useEffect(() => {
    if (touchedAction === true) {
      sound.play();
    } else {
      sound.pause();
    }
  }, [touchedAction]);

  const sleep = (ms = 0) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };
  const [runningTime, setRunningTime] = useState(0);
  const handleStart = () => {
  setRunningTime(0);
  setInterval(() => {
    setRunningTime((prevTime) => prevTime + 1);
  }, 1000);
  handleRun();
};
  const run = () =>{
    handleStart()
    handleRun()
  }
const handleStop = () => {
  clearInterval();
  
};

  return (
    <div className="main">
      <ToastContainer></ToastContainer>
      {touchedAction ? <div className="warning-layout"></div> : <div></div>}

      <div className="process-bar"></div>
      <div className="inner">
        <div className="left-content">
          <video ref={vid} className="video" autoPlay></video>
          {setUpModule ? (
            <div className="control">
              <button className="btn" onClick={() => train(UNTOUCH_LABEL)}>
                Train 1
              </button>
              <button className="btn" onClick={() => train(TOUCHED_LABEL)}>
                Train 2
              </button>
              {trainSuccess
              ? <button className="btn" onClick={() => run()}>
              Run
            </button>:<button className="btn" onClick={()=>{alert('Chưa Có Dữ Liệu Hãy Train')}}>Run</button>
             }
            </div>
          ) : (
            <span class="loader"></span>
          )}
        </div>
        <div className="right-content">
          <h1 className="content-header">Ứng Dụng Warning Touch Face</h1>
          <h3 className="content-h3">Hướng dẫn sử dụng Touch Face</h3>
          <ul className="content-list">
            <li className="content-item">
              Bước 1: Hãy cho phép truy cập camera, ngồi cách màn hình 2m
            </li>
            <li className="content-item">
              Bước 2: Đưa khuôn mặt cho vào khung hình click train 1
            </li>
            <li className="content-item">
              Bước 3: Sau đó đưa khuôn mặt vào khung hình, lấy tay để gần lên
              mặt rồi bấm Train 2
            </li>
            <li className="content-item">
              Bước 4: Đợi cho quá trình máy học hoàn tất
            </li>
            <li className="content-item">
              Bước 5: Sau đó bấm Run để bắt đầu thực hiện
            </li>
          </ul>
          <div className="running-time">Thời Gian Chạy: {runningTime}s</div>
        </div>
      </div>
    </div>
  );
}

export default App;
