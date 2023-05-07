import SwiftUI


struct ContentView: View {
    var body: some View {
        Text("Hello from Expo!")
    }
}

@main
struct watchApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}