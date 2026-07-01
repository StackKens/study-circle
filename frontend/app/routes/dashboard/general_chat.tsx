import GeneralChat from "../../components/GeneralChat";

export default function GeneralChatPage() {
  return (
    <div className="max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-4">
      <div className="h-[600px] lg:h-[calc(100vh-10rem)]">
        <GeneralChat />
      </div>
    </div>
  );
}
