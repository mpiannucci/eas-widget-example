import SwiftUI


struct ContentView: View {
    var body: some View {
        Text("Hello, World!")
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