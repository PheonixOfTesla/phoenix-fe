// PhoenixIntentHandler.swift
// Handles Siri Shortcuts for Phoenix AI

import Foundation
import Intents

@available(iOS 13.0, *)
class PhoenixIntentHandler: INExtension {

    override func handler(for intent: INIntent) -> Any {
        switch intent {
        case is BookRideIntent:
            return BookRideIntentHandler()
        case is OrderFoodIntent:
            return OrderFoodIntentHandler()
        case is LogWorkoutIntent:
            return LogWorkoutIntentHandler()
        case is MakeReservationIntent:
            return MakeReservationIntentHandler()
        case is CallContactIntent:
            return CallContactIntentHandler()
        case is SendMessageIntent:
            return SendMessageIntentHandler()
        case is DailySummaryIntent:
            return DailySummaryIntentHandler()
        case is CheckRecoveryIntent:
            return CheckRecoveryIntentHandler()
        default:
            fatalError("Unhandled intent type: \(intent)")
        }
    }
}

// MARK: - Book Ride Handler
@available(iOS 13.0, *)
class BookRideIntentHandler: NSObject, BookRideIntentHandling {

    func handle(intent: BookRideIntent, completion: @escaping (BookRideIntentResponse) -> Void) {
        let destination = intent.destination ?? "your location"
        let provider = intent.provider ?? .any

        // Call Phoenix backend
        callPhoenixAPI(
            endpoint: "/api/phoenix/butler/ride",
            params: [
                "destination": destination,
                "provider": provider.rawValue
            ]
        ) { result in
            switch result {
            case .success(let data):
                let response = BookRideIntentResponse(code: .success, userActivity: nil)
                response.message = data["message"] as? String ?? "Ride booked successfully!"
                completion(response)

            case .failure(let error):
                let response = BookRideIntentResponse(code: .failure, userActivity: nil)
                response.message = "Failed to book ride: \(error.localizedDescription)"
                completion(response)
            }
        }
    }

    func confirm(intent: BookRideIntent, completion: @escaping (BookRideIntentResponse) -> Void) {
        let response = BookRideIntentResponse(code: .ready, userActivity: nil)
        completion(response)
    }
}

// MARK: - Order Food Handler
@available(iOS 13.0, *)
class OrderFoodIntentHandler: NSObject, OrderFoodIntentHandling {

    func handle(intent: OrderFoodIntent, completion: @escaping (OrderFoodIntentResponse) -> Void) {
        let restaurant = intent.restaurant
        let reorder = intent.reorder?.boolValue ?? true

        callPhoenixAPI(
            endpoint: "/api/phoenix/butler/food/order",
            params: [
                "restaurant": restaurant as Any,
                "reorder": reorder
            ]
        ) { result in
            switch result {
            case .success(let data):
                let response = OrderFoodIntentResponse(code: .success, userActivity: nil)
                response.message = data["message"] as? String ?? "Food ordered successfully!"
                completion(response)

            case .failure(let error):
                let response = OrderFoodIntentResponse(code: .failure, userActivity: nil)
                response.message = "Failed to order food: \(error.localizedDescription)"
                completion(response)
            }
        }
    }
}

// MARK: - Log Workout Handler
@available(iOS 13.0, *)
class LogWorkoutIntentHandler: NSObject, LogWorkoutIntentHandling {

    func handle(intent: LogWorkoutIntent, completion: @escaping (LogWorkoutIntentResponse) -> Void) {
        let workoutType = intent.type?.rawValue ?? "general"
        let duration = intent.duration?.intValue ?? 0

        callPhoenixAPI(
            endpoint: "/api/venus/workouts/log",
            params: [
                "type": workoutType,
                "duration": duration,
                "source": "siri"
            ]
        ) { result in
            switch result {
            case .success(let data):
                let response = LogWorkoutIntentResponse(code: .success, userActivity: nil)
                response.message = "Workout logged! Great job! 💪"
                completion(response)

            case .failure(let error):
                let response = LogWorkoutIntentResponse(code: .failure, userActivity: nil)
                response.message = "Failed to log workout"
                completion(response)
            }
        }
    }
}

// MARK: - Make Reservation Handler
@available(iOS 13.0, *)
class MakeReservationIntentHandler: NSObject, MakeReservationIntentHandling {

    func handle(intent: MakeReservationIntent, completion: @escaping (MakeReservationIntentResponse) -> Void) {
        guard let restaurant = intent.restaurant else {
            let response = MakeReservationIntentResponse(code: .failure, userActivity: nil)
            response.message = "Please specify a restaurant"
            completion(response)
            return
        }

        let partySize = intent.partySize?.intValue ?? 2

        callPhoenixAPI(
            endpoint: "/api/phoenix/butler/reservation",
            params: [
                "restaurant": restaurant,
                "partySize": partySize,
                "time": intent.time as Any
            ]
        ) { result in
            switch result {
            case .success(let data):
                let response = MakeReservationIntentResponse(code: .success, userActivity: nil)
                response.message = "Reservation confirmed at \(restaurant)!"
                completion(response)

            case .failure(let error):
                let response = MakeReservationIntentResponse(code: .failure, userActivity: nil)
                response.message = "Couldn't book reservation"
                completion(response)
            }
        }
    }
}

// MARK: - Daily Summary Handler
@available(iOS 13.0, *)
class DailySummaryIntentHandler: NSObject, DailySummaryIntentHandling {

    func handle(intent: DailySummaryIntent, completion: @escaping (DailySummaryIntentResponse) -> Void) {
        callPhoenixAPI(endpoint: "/api/phoenix/daily-summary", params: [:]) { result in
            switch result {
            case .success(let data):
                let summary = data["summary"] as? String ?? "Your day is looking good!"
                let response = DailySummaryIntentResponse(code: .success, userActivity: nil)
                response.message = summary
                completion(response)

            case .failure:
                let response = DailySummaryIntentResponse(code: .failure, userActivity: nil)
                completion(response)
            }
        }
    }
}

// MARK: - Check Recovery Handler
@available(iOS 13.0, *)
class CheckRecoveryIntentHandler: NSObject, CheckRecoveryIntentHandling {

    func handle(intent: CheckRecoveryIntent, completion: @escaping (CheckRecoveryIntentResponse) -> Void) {
        callPhoenixAPI(endpoint: "/api/mercury/recovery/status", params: [:]) { result in
            switch result {
            case .success(let data):
                let hrv = data["hrv"] as? Int ?? 0
                let status = data["status"] as? String ?? "unknown"
                let message = "Your HRV is \(hrv). Recovery status: \(status)"

                let response = CheckRecoveryIntentResponse(code: .success, userActivity: nil)
                response.message = message
                completion(response)

            case .failure:
                let response = CheckRecoveryIntentResponse(code: .failure, userActivity: nil)
                completion(response)
            }
        }
    }
}

// MARK: - Helper: Call Phoenix API
func callPhoenixAPI(
    endpoint: String,
    params: [String: Any],
    completion: @escaping (Result<[String: Any], Error>) -> Void
) {
    let baseURL = "https://pal-backend-production.up.railway.app"
    guard let url = URL(string: baseURL + endpoint) else {
        completion(.failure(NSError(domain: "Invalid URL", code: -1, userInfo: nil)))
        return
    }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")

    // Get auth token from keychain
    if let token = getAuthToken() {
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    }

    // Add parameters
    if !params.isEmpty {
        request.httpBody = try? JSONSerialization.data(withJSONObject: params)
    }

    URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
            completion(.failure(error))
            return
        }

        guard let data = data,
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            completion(.failure(NSError(domain: "Invalid response", code: -1, userInfo: nil)))
            return
        }

        completion(.success(json))
    }.resume()
}

// MARK: - Helper: Get Auth Token from Keychain
func getAuthToken() -> String? {
    let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrAccount as String: "phoenix-auth-token",
        kSecReturnData as String: true
    ]

    var result: AnyObject?
    let status = SecItemCopyMatching(query as CFDictionary, &result)

    guard status == errSecSuccess,
          let data = result as? Data,
          let token = String(data: data, encoding: .utf8) else {
        return nil
    }

    return token
}
